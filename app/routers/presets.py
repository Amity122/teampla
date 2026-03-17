from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from ..core.database import get_session
from ..models.preset import Preset
from ..schemas.preset import PresetCreate, PresetRead, PresetUpdate

router = APIRouter(prefix="/presets", tags=["Presets"])


@router.get("/", response_model=List[PresetRead])
def list_presets(session: Session = Depends(get_session)):
    return session.exec(select(Preset)).all()


@router.post("/", response_model=PresetRead, status_code=201)
def create_preset(data: PresetCreate, session: Session = Depends(get_session)):
    if session.exec(select(Preset).where(Preset.name == data.name)).first():
        raise HTTPException(status_code=409, detail="A preset with this name already exists.")

    preset = Preset(name=data.name, config=data.config.model_dump())
    session.add(preset)
    session.commit()
    session.refresh(preset)
    return preset


@router.get("/{preset_id}", response_model=PresetRead)
def get_preset(preset_id: str, session: Session = Depends(get_session)):
    preset = session.get(Preset, preset_id)
    if not preset:
        raise HTTPException(status_code=404, detail="Preset not found.")
    return preset


@router.put("/{preset_id}", response_model=PresetRead)
def update_preset(
    preset_id: str, data: PresetUpdate, session: Session = Depends(get_session)
):
    preset = session.get(Preset, preset_id)
    if not preset:
        raise HTTPException(status_code=404, detail="Preset not found.")

    if data.name is not None:
        conflict = session.exec(
            select(Preset).where(Preset.name == data.name).where(Preset.id != preset_id)
        ).first()
        if conflict:
            raise HTTPException(
                status_code=409, detail="A preset with this name already exists."
            )
        preset.name = data.name

    if data.config is not None:
        preset.config = data.config.model_dump()

    preset.updated_at = datetime.now(timezone.utc)
    session.add(preset)
    session.commit()
    session.refresh(preset)
    return preset


@router.delete("/{preset_id}", status_code=204)
def delete_preset(preset_id: str, session: Session = Depends(get_session)):
    preset = session.get(Preset, preset_id)
    if not preset:
        raise HTTPException(status_code=404, detail="Preset not found.")
    session.delete(preset)
    session.commit()
