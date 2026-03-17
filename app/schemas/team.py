from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel

from ..models.member import PrimaryTeam
from .member import MemberRead


class ConflictInfo(BaseModel):
    type: str  # EMPTY_POOL | INSUFFICIENT_SENIORS | INSUFFICIENT_SPECIALIZATION | SIZE_VIOLATION
    message: str


class TeamMemberInfo(BaseModel):
    member: MemberRead
    manually_swapped: bool = False


class TeamRead(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    name: str
    session_id: str
    preset_id: Optional[str]
    created_at: datetime
    members: List[TeamMemberInfo] = []


class RandomizerConfig(BaseModel):
    num_teams: int
    min_members: Optional[int] = None
    max_members: Optional[int] = None
    require_senior_per_team: bool = True
    required_specializations: List[PrimaryTeam] = []
    group_by_shift: bool = False
    # None means use the entire member pool
    member_ids: Optional[List[str]] = None
    # Optional integer seed for reproducible runs
    seed: Optional[int] = None


class GenerateTeamsRequest(BaseModel):
    config: RandomizerConfig
    preset_id: Optional[str] = None
    # If True, saves generated teams to the database
    persist: bool = False


class GenerateTeamsResponse(BaseModel):
    session_id: str
    teams: List[TeamRead]
    conflicts: List[ConflictInfo]
    generated_at: datetime
    config: RandomizerConfig


class SwapWarning(BaseModel):
    type: str
    message: str


class SwapResponse(BaseModel):
    success: bool
    warning: Optional[SwapWarning] = None
