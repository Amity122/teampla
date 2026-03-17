"""
Team generation algorithm.

This is a pure function with no database access — it receives a list of Member
objects and a RandomizerConfig, and returns a GenerateTeamsResponse. Keeping it
side-effect-free makes it trivially unit-testable.

Algorithm (matches PRD §3.2.2):
  1. Guard checks (empty pool, not enough members)
  2. Sort all members by active_project_count ascending (least-loaded first)
  3. Seed seniors into teams (if require_senior_per_team)
  4. Seed required specializations into teams (if any)
  5. Shuffle remaining members within project-count groups for variety
  6. Round-robin distribute remaining members
  7. Optional shift-affinity grouping
  8. Intra-team display shuffle (seniors first, then shuffled juniors)
  9. Validate size constraints and collect conflicts
  10. Build and return response
"""

import random
import uuid
from collections import Counter
from datetime import datetime, timezone
from typing import List

from ..models.member import Member, PrimaryTeam, SkillLevel
from ..schemas.member import MemberRead
from ..schemas.team import (
    ConflictInfo,
    GenerateTeamsResponse,
    RandomizerConfig,
    TeamMemberInfo,
    TeamRead,
)

TEAM_NAMES = [
    "Alpha", "Beta", "Gamma", "Delta", "Epsilon",
    "Zeta", "Eta", "Theta", "Iota", "Kappa",
    "Lambda", "Mu", "Nu", "Xi", "Omicron",
    "Pi", "Rho", "Sigma", "Tau", "Upsilon",
]

_SENIOR_LEVELS = {SkillLevel.senior, SkillLevel.lead}


def _team_name(index: int) -> str:
    if index < len(TEAM_NAMES):
        return f"Team {TEAM_NAMES[index]}"
    return f"Team {index + 1}"


def _to_read(member: Member) -> MemberRead:
    return MemberRead.model_validate(member)


def generate_teams(
    members: List[Member],
    config: RandomizerConfig,
) -> GenerateTeamsResponse:
    session_id = str(uuid.uuid4())
    conflicts: List[ConflictInfo] = []

    # --- Step 1: Guard checks ---
    if not members:
        return GenerateTeamsResponse(
            session_id=session_id,
            teams=[],
            conflicts=[ConflictInfo(type="EMPTY_POOL", message="No members in the pool.")],
            generated_at=datetime.now(timezone.utc),
            config=config,
        )

    num_teams = config.num_teams

    if len(members) < num_teams:
        conflicts.append(
            ConflictInfo(
                type="SIZE_VIOLATION",
                message=(
                    f"Only {len(members)} member(s) for {num_teams} teams. "
                    "Some teams will be empty."
                ),
            )
        )

    # Seed RNG for reproducibility if requested
    if config.seed is not None:
        random.seed(config.seed)

    # --- Step 2: Sort by project load (ascending) ---
    pool: List[Member] = sorted(members, key=lambda m: m.active_project_count)

    # team_slots[i] = list of (Member, manually_swapped)
    team_slots: List[List[tuple]] = [[] for _ in range(num_teams)]
    assigned_ids: set = set()

    def assign(team_idx: int, member: Member) -> None:
        team_slots[team_idx].append((member, False))
        assigned_ids.add(member.id)
        pool.remove(member)

    # --- Step 3: Seed one Senior/Lead per team ---
    if config.require_senior_per_team:
        seniors = [m for m in pool if m.skill_level in _SENIOR_LEVELS]
        if len(seniors) < num_teams:
            missing = num_teams - len(seniors)
            conflicts.append(
                ConflictInfo(
                    type="INSUFFICIENT_SENIORS",
                    message=(
                        f"Only {len(seniors)} Senior/Lead member(s) for {num_teams} team(s). "
                        f"{missing} team(s) will lack a senior."
                    ),
                )
            )
        random.shuffle(seniors)
        for i, senior in enumerate(seniors):
            assign(i % num_teams, senior)

    # --- Step 4: Seed required specializations ---
    for spec in config.required_specializations:
        for team_idx in range(num_teams):
            already_has = any(m.primary_team == spec for m, _ in team_slots[team_idx])
            if already_has:
                continue
            candidates = [m for m in pool if m.primary_team == spec]
            if not candidates:
                conflicts.append(
                    ConflictInfo(
                        type="INSUFFICIENT_SPECIALIZATION",
                        message=f"No available {spec.value} member for team {team_idx + 1}.",
                    )
                )
                continue
            # Take the least-loaded candidate (pool is already sorted)
            assign(team_idx, candidates[0])

    # --- Step 5: Shuffle remaining within project-count groups ---
    groups: dict = {}
    for m in pool:
        groups.setdefault(m.active_project_count, []).append(m)

    shuffled_pool: List[Member] = []
    for count in sorted(groups.keys()):
        group = groups[count]
        random.shuffle(group)
        shuffled_pool.extend(group)

    # --- Step 6 / 7: Distribute remaining (with optional shift affinity) ---
    start_idx = min(range(num_teams), key=lambda i: len(team_slots[i]))

    if config.group_by_shift and shuffled_pool:
        def dominant_shift(slot):
            if not slot:
                return None
            return Counter(m.shift for m, _ in slot).most_common(1)[0][0]

        team_dominant_shifts = [dominant_shift(team_slots[i]) for i in range(num_teams)]

        for member in shuffled_pool:
            preferred = [
                i for i in range(num_teams) if team_dominant_shifts[i] == member.shift
            ]
            target = (
                min(preferred, key=lambda i: len(team_slots[i]))
                if preferred
                else min(range(num_teams), key=lambda i: len(team_slots[i]))
            )
            team_slots[target].append((member, False))
    else:
        for offset, member in enumerate(shuffled_pool):
            team_idx = (start_idx + offset) % num_teams
            team_slots[team_idx].append((member, False))

    # --- Step 8: Intra-team display shuffle (seniors first) ---
    for slot in team_slots:
        senior_entries = [(m, sw) for m, sw in slot if m.skill_level in _SENIOR_LEVELS]
        other_entries = [(m, sw) for m, sw in slot if m.skill_level not in _SENIOR_LEVELS]
        random.shuffle(other_entries)
        slot.clear()
        slot.extend(senior_entries + other_entries)

    # --- Step 9: Validate sizes ---
    for i, slot in enumerate(team_slots):
        if config.min_members is not None and len(slot) < config.min_members:
            conflicts.append(
                ConflictInfo(
                    type="SIZE_VIOLATION",
                    message=(
                        f"Team {i + 1} has {len(slot)} member(s), "
                        f"below minimum of {config.min_members}."
                    ),
                )
            )
        if config.max_members is not None and len(slot) > config.max_members:
            conflicts.append(
                ConflictInfo(
                    type="SIZE_VIOLATION",
                    message=(
                        f"Team {i + 1} has {len(slot)} member(s), "
                        f"above maximum of {config.max_members}."
                    ),
                )
            )
        if config.require_senior_per_team:
            if not any(m.skill_level in _SENIOR_LEVELS for m, _ in slot):
                conflicts.append(
                    ConflictInfo(
                        type="INSUFFICIENT_SENIORS",
                        message=f"Team {i + 1} has no Senior or Lead member.",
                    )
                )

    # --- Step 10: Build response ---
    teams: List[TeamRead] = []
    for i, slot in enumerate(team_slots):
        teams.append(
            TeamRead(
                id=str(uuid.uuid4()),
                name=_team_name(i),
                session_id=session_id,
                preset_id=None,
                created_at=datetime.now(timezone.utc),
                members=[
                    TeamMemberInfo(member=_to_read(m), manually_swapped=sw)
                    for m, sw in slot
                ],
            )
        )

    return GenerateTeamsResponse(
        session_id=session_id,
        teams=teams,
        conflicts=conflicts,
        generated_at=datetime.now(timezone.utc),
        config=config,
    )
