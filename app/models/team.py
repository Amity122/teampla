import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlmodel import Field, SQLModel


class TeamMemberLink(SQLModel, table=True):
    __tablename__ = "team_member_link"

    team_id: str = Field(foreign_key="team.id", primary_key=True)
    member_id: str = Field(foreign_key="member.id", primary_key=True)
    manually_swapped: bool = Field(default=False)


class GeneratedTeam(SQLModel, table=True):
    __tablename__ = "team"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str
    # Groups all teams produced by a single randomizer run
    session_id: str = Field(index=True)
    preset_id: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
