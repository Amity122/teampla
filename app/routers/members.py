from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select

from ..core.database import get_session
from ..models.member import Member, PrimaryTeam, ShiftSchedule, SkillLevel
from ..schemas.member import MemberCreate, MemberRead, MemberUpdate

router = APIRouter(prefix="/members", tags=["Members"])


@router.get("/", response_model=List[MemberRead])
def list_members(
    skill_level: Optional[SkillLevel] = Query(None),
    shift: Optional[ShiftSchedule] = Query(None),
    primary_team: Optional[PrimaryTeam] = Query(None),
    max_projects: Optional[int] = Query(None),
    session: Session = Depends(get_session),
):
    """List all members, with optional filters."""
    stmt = select(Member)
    if skill_level:
        stmt = stmt.where(Member.skill_level == skill_level)
    if shift:
        stmt = stmt.where(Member.shift == shift)
    if primary_team:
        stmt = stmt.where(Member.primary_team == primary_team)
    if max_projects is not None:
        stmt = stmt.where(Member.active_project_count <= max_projects)
    return session.exec(stmt).all()


@router.post("/", response_model=MemberRead, status_code=201)
def create_member(data: MemberCreate, session: Session = Depends(get_session)):
    """Create a new member profile."""
    existing = session.exec(select(Member).where(Member.email == data.email)).first()
    if existing:
        raise HTTPException(status_code=409, detail="A member with this email already exists.")

    member = Member(
        name=data.name,
        email=data.email,
        skill_level=data.skill_level,
        primary_team=data.primary_team,
        other_team_name=data.other_team_name,
        shift=data.shift,
        weekly_schedule=data.weekly_schedule,
        active_project_count=data.active_project_count,
        is_admin=data.is_admin,
    )
    session.add(member)
    session.commit()
    session.refresh(member)
    return member


@router.get("/{member_id}", response_model=MemberRead)
def get_member(member_id: str, session: Session = Depends(get_session)):
    member = session.get(Member, member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found.")
    return member


@router.put("/{member_id}", response_model=MemberRead)
def update_member(
    member_id: str, data: MemberUpdate, session: Session = Depends(get_session)
):
    """Update a member profile (partial update — only provided fields are changed)."""
    member = session.get(Member, member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found.")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(member, key, value)
    member.updated_at = datetime.now(timezone.utc)

    session.add(member)
    session.commit()
    session.refresh(member)
    return member


@router.delete("/{member_id}", status_code=204)
def delete_member(member_id: str, session: Session = Depends(get_session)):
    member = session.get(Member, member_id)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found.")
    session.delete(member)
    session.commit()
