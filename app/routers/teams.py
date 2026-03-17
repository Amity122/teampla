from typing import List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException
from sqlmodel import Session, select

from ..core.database import get_session
from ..models.member import Member, SkillLevel
from ..models.team import GeneratedTeam, TeamMemberLink
from ..schemas.member import MemberRead
from ..schemas.team import (
    GenerateTeamsRequest,
    GenerateTeamsResponse,
    SwapResponse,
    SwapWarning,
    TeamMemberInfo,
    TeamRead,
)
from ..services.randomizer import generate_teams as run_generate

router = APIRouter(prefix="/teams", tags=["Teams"])

_SENIOR_LEVELS = {SkillLevel.senior, SkillLevel.lead}


def _load_team(team: GeneratedTeam, session: Session) -> TeamRead:
    """Build a TeamRead with full member objects from the DB."""
    links = session.exec(
        select(TeamMemberLink).where(TeamMemberLink.team_id == team.id)
    ).all()
    members_info = []
    for link in links:
        member = session.get(Member, link.member_id)
        if member:
            members_info.append(
                TeamMemberInfo(
                    member=MemberRead.model_validate(member),
                    manually_swapped=link.manually_swapped,
                )
            )
    return TeamRead(
        id=team.id,
        name=team.name,
        session_id=team.session_id,
        preset_id=team.preset_id,
        created_at=team.created_at,
        members=members_info,
    )


@router.post("/generate", response_model=GenerateTeamsResponse)
def generate(request: GenerateTeamsRequest, session: Session = Depends(get_session)):
    """Run the randomizer algorithm and optionally persist the result."""
    config = request.config

    # Fetch the member pool
    if config.member_ids:
        members = [session.get(Member, mid) for mid in config.member_ids]
        members = [m for m in members if m is not None]
    else:
        members = list(session.exec(select(Member)).all())

    result = run_generate(members, config)

    if request.persist:
        for team_read in result.teams:
            db_team = GeneratedTeam(
                id=team_read.id,
                name=team_read.name,
                session_id=result.session_id,
                preset_id=request.preset_id,
            )
            session.add(db_team)
            for tm in team_read.members:
                session.add(
                    TeamMemberLink(
                        team_id=team_read.id,
                        member_id=tm.member.id,
                        manually_swapped=tm.manually_swapped,
                    )
                )
        session.commit()

    return result


@router.get("/", response_model=List[TeamRead])
def list_teams(
    session_id: Optional[str] = None,
    session: Session = Depends(get_session),
):
    """List saved teams, optionally filtered to a single randomizer session."""
    stmt = select(GeneratedTeam)
    if session_id:
        stmt = stmt.where(GeneratedTeam.session_id == session_id)
    teams = session.exec(stmt).all()
    return [_load_team(t, session) for t in teams]


@router.get("/{team_id}", response_model=TeamRead)
def get_team(team_id: str, session: Session = Depends(get_session)):
    team = session.get(GeneratedTeam, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found.")
    return _load_team(team, session)


@router.delete("/{team_id}", status_code=204)
def delete_team(team_id: str, session: Session = Depends(get_session)):
    team = session.get(GeneratedTeam, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found.")
    for link in session.exec(
        select(TeamMemberLink).where(TeamMemberLink.team_id == team_id)
    ).all():
        session.delete(link)
    session.delete(team)
    session.commit()


@router.patch("/{team_id}/members", response_model=TeamRead)
def update_member_assignments(
    team_id: str,
    member_ids: List[str] = Body(...),
    session: Session = Depends(get_session),
):
    """Replace the member list of a saved team (used after drag-to-swap is confirmed)."""
    team = session.get(GeneratedTeam, team_id)
    if not team:
        raise HTTPException(status_code=404, detail="Team not found.")

    for link in session.exec(
        select(TeamMemberLink).where(TeamMemberLink.team_id == team_id)
    ).all():
        session.delete(link)

    for member_id in member_ids:
        session.add(TeamMemberLink(team_id=team_id, member_id=member_id))

    session.commit()
    session.refresh(team)
    return _load_team(team, session)


@router.post("/swap", response_model=SwapResponse)
def swap_members(
    team_id_a: str,
    member_id_a: str,
    team_id_b: str,
    member_id_b: str,
    session: Session = Depends(get_session),
):
    """
    Swap two members between two saved teams.
    Returns a non-blocking warning if the swap creates a skill imbalance.
    """
    for tid in (team_id_a, team_id_b):
        if not session.get(GeneratedTeam, tid):
            raise HTTPException(status_code=404, detail=f"Team {tid} not found.")

    link_a = session.exec(
        select(TeamMemberLink)
        .where(TeamMemberLink.team_id == team_id_a)
        .where(TeamMemberLink.member_id == member_id_a)
    ).first()
    link_b = session.exec(
        select(TeamMemberLink)
        .where(TeamMemberLink.team_id == team_id_b)
        .where(TeamMemberLink.member_id == member_id_b)
    ).first()

    if not link_a or not link_b:
        raise HTTPException(status_code=404, detail="One or both member assignments not found.")

    # Perform the swap
    link_a.team_id = team_id_b
    link_a.manually_swapped = True
    link_b.team_id = team_id_a
    link_b.manually_swapped = True

    session.add(link_a)
    session.add(link_b)
    session.commit()

    # Advisory warning for skill imbalance (non-blocking per PRD §3.3)
    warning = None
    m_a = session.get(Member, member_id_a)
    m_b = session.get(Member, member_id_b)
    if m_a and m_b:
        a_is_senior = m_a.skill_level in _SENIOR_LEVELS
        b_is_senior = m_b.skill_level in _SENIOR_LEVELS
        if a_is_senior != b_is_senior:
            warning = SwapWarning(
                type="SKILL_IMBALANCE",
                message=(
                    "This swap may create a skill imbalance — "
                    "one team may gain more senior members than the other."
                ),
            )

    return SwapResponse(success=True, warning=warning)
