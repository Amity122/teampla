"""
Export formatters — pure functions that take a list of TeamRead and return a string.
No database access. Called by the export router.
"""

import csv
import io
from typing import List

from ..schemas.team import TeamRead


def _display_team(member_read) -> str:
    if member_read.primary_team.value == "Other" and member_read.other_team_name:
        return member_read.other_team_name
    return member_read.primary_team.value


def format_slack(teams: List[TeamRead]) -> str:
    """Produce Slack-formatted output (bold team headers, bullet member list)."""
    lines: List[str] = []
    for team in teams:
        lines.append(f"*{team.name}*")
        for tm in team.members:
            m = tm.member
            projects = f"{m.active_project_count} project{'s' if m.active_project_count != 1 else ''}"
            flag = " _(manually adjusted)_" if tm.manually_swapped else ""
            lines.append(
                f"• {m.name} ({m.skill_level.value} · {_display_team(m)} · "
                f"{m.shift.value} · {projects}){flag}"
            )
        lines.append("")
    return "\n".join(lines).strip()


def format_csv(teams: List[TeamRead]) -> str:
    """Produce a CSV string with headers: Team,Name,Skill Level,Specialization,Shift,Active Projects"""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Team", "Name", "Skill Level", "Specialization", "Shift", "Active Projects"])
    for team in teams:
        for tm in team.members:
            m = tm.member
            writer.writerow(
                [
                    team.name,
                    m.name,
                    m.skill_level.value,
                    _display_team(m),
                    m.shift.value,
                    m.active_project_count,
                ]
            )
    return output.getvalue()


def format_plain_text(teams: List[TeamRead]) -> str:
    """Produce plain-text output suitable for clipboard copy."""
    lines: List[str] = []
    for team in teams:
        lines.append(team.name)
        lines.append("-" * len(team.name))
        for tm in team.members:
            m = tm.member
            projects = f"{m.active_project_count} project{'s' if m.active_project_count != 1 else ''}"
            flag = " [manually adjusted]" if tm.manually_swapped else ""
            lines.append(
                f"  - {m.name} ({m.skill_level.value}, {_display_team(m)}, "
                f"{m.shift.value}, {projects}){flag}"
            )
        lines.append("")
    return "\n".join(lines).strip()
