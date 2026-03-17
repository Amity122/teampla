import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from sqlalchemy import Column, JSON
from sqlmodel import Field, SQLModel


class SkillLevel(str, Enum):
    junior = "Junior"
    mid_level = "Mid-level"
    senior = "Senior"
    lead = "Lead"


class PrimaryTeam(str, Enum):
    backend = "Backend"
    frontend = "Frontend"
    devops = "DevOps"
    qa_testing = "QA / Testing"
    mobile = "Mobile"
    data_analytics = "Data / Analytics"
    full_stack = "Full Stack"
    other = "Other"


class ShiftSchedule(str, Enum):
    day = "Day Shift"
    afternoon = "Afternoon Shift"
    night = "Night Shift"


class ScheduleStatus(str, Enum):
    onsite = "onsite"
    wfh = "wfh"
    dayoff = "dayoff"


class Member(SQLModel, table=True):
    __tablename__ = "member"

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str = Field(index=True)
    email: str = Field(unique=True, index=True)
    skill_level: SkillLevel
    primary_team: PrimaryTeam
    other_team_name: Optional[str] = Field(default=None)
    shift: ShiftSchedule
    # JSON dict: {"mon": "onsite", "tue": "wfh", ...}
    weekly_schedule: dict = Field(default_factory=dict, sa_column=Column(JSON))
    active_project_count: int = Field(default=0)
    is_admin: bool = Field(default=False)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
