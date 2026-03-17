from typing import List

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlmodel import Session, select

from ..core.database import get_session
from ..models.member import Member
from ..models.team import GeneratedTeam, TeamMemberLink
from ..schemas.export import ExportFormat, ExportRequest
from ..schemas.member import MemberRead
from ..schemas.team import TeamMemberInfo, TeamRead
from ..services.export import format_csv, format_plain_text, format_slack

router = APIRouter(prefix="/export", tags=["Export"])


def _load_teams_for_session(session_id: str, db: Session) -> List[TeamRead]:
    teams_db = db.exec(
        select(GeneratedTeam).where(GeneratedTeam.session_id == session_id)
    ).all()
    if not teams_db:
        return []

    result = []
    for team in teams_db:
        links = db.exec(
            select(TeamMemberLink).where(TeamMemberLink.team_id == team.id)
        ).all()
        members_info = []
        for link in links:
            member = db.get(Member, link.member_id)
            if member:
                members_info.append(
                    TeamMemberInfo(
                        member=MemberRead.model_validate(member),
                        manually_swapped=link.manually_swapped,
                    )
                )
        result.append(
            TeamRead(
                id=team.id,
                name=team.name,
                session_id=team.session_id,
                preset_id=team.preset_id,
                created_at=team.created_at,
                members=members_info,
            )
        )
    return result


@router.post("/")
def export_teams(request: ExportRequest, db: Session = Depends(get_session)):
    """
    Export saved teams to Slack format, CSV, or plain text.
    The session_id identifies the randomizer run to export.
    """
    teams = _load_teams_for_session(request.session_id, db)
    if not teams:
        raise HTTPException(
            status_code=404,
            detail=f"No saved teams found for session '{request.session_id}'.",
        )

    if request.format == ExportFormat.slack:
        return Response(content=format_slack(teams), media_type="text/plain")

    if request.format == ExportFormat.csv:
        return Response(
            content=format_csv(teams),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=teams.csv"},
        )

    # plain_text
    return Response(content=format_plain_text(teams), media_type="text/plain")
