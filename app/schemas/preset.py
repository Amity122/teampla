from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from .team import RandomizerConfig


class PresetCreate(BaseModel):
    name: str
    config: RandomizerConfig


class PresetUpdate(BaseModel):
    name: Optional[str] = None
    config: Optional[RandomizerConfig] = None


class PresetRead(BaseModel):
    model_config = {"from_attributes": True}

    id: str
    name: str
    config: dict
    created_by: Optional[str]
    created_at: datetime
    updated_at: datetime
