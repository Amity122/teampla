from datetime import datetime
from typing import Optional

from pydantic import BaseModel, field_validator, model_validator

from ..models.member import PrimaryTeam, ScheduleStatus, ShiftSchedule, SkillLevel

_VALID_DAYS = {"mon", "tue", "wed", "thu", "fri", "sat", "sun"}
_VALID_STATUSES = {s.value for s in ScheduleStatus}


def _validate_weekly_schedule(schedule: dict) -> dict:
    if set(schedule.keys()) != _VALID_DAYS:
        raise ValueError(f"weekly_schedule must have exactly these keys: {sorted(_VALID_DAYS)}")
    for day, val in schedule.items():
        if val not in _VALID_STATUSES:
            raise ValueError(
                f"Invalid value '{val}' for {day}. Must be one of: {_VALID_STATUSES}"
            )
    return schedule


class MemberCreate(BaseModel):
    name: str
    email: str
    skill_level: SkillLevel
    primary_team: PrimaryTeam
    other_team_name: Optional[str] = None
    shift: ShiftSchedule
    weekly_schedule: dict
    active_project_count: int = 0
    is_admin: bool = False

    @field_validator("active_project_count")
    @classmethod
    def non_negative(cls, v: int) -> int:
        if v < 0:
            raise ValueError("active_project_count must be >= 0")
        return v

    @field_validator("weekly_schedule")
    @classmethod
    def valid_schedule(cls, v: dict) -> dict:
        return _validate_weekly_schedule(v)

    @model_validator(mode="after")
    def other_team_name_required(self) -> "MemberCreate":
        if self.primary_team == PrimaryTeam.other and not self.other_team_name:
            raise ValueError("other_team_name is required when primary_team is 'Other'")
        return self


class MemberUpdate(BaseModel):
    name: Optional[str] = None
    skill_level: Optional[SkillLevel] = None
    primary_team: Optional[PrimaryTeam] = None
    other_team_name: Optional[str] = None
    shift: Optional[ShiftSchedule] = None
    weekly_schedule: Optional[dict] = None
    active_project_count: Optional[int] = None
    is_admin: Optional[bool] = None

    @field_validator("active_project_count")
    @classmethod
    def non_negative(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v < 0:
            raise ValueError("active_project_count must be >= 0")
        return v

    @field_validator("weekly_schedule")
    @classmethod
    def valid_schedule(cls, v: Optional[dict]) -> Optional[dict]:
        if v is not None:
            return _validate_weekly_schedule(v)
        return v


class MemberRead(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    name: str
    email: str
    skill_level: SkillLevel
    primary_team: PrimaryTeam
    other_team_name: Optional[str]
    shift: ShiftSchedule
    weekly_schedule: dict
    active_project_count: int
    is_admin: bool
    updated_at: datetime
