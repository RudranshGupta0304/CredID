from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..models import ActivityEvent
from ..schemas import ActivityEventResponse

router = APIRouter(prefix="/activity", tags=["Activity"])

@router.get("", response_model=List[ActivityEventResponse])
def get_all_activity(
    limit: int = 50,
    entity_type: Optional[str] = None,
    actor: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(ActivityEvent)
    if entity_type:
        query = query.filter(ActivityEvent.entity_type == entity_type)
    if actor:
        query = query.filter(ActivityEvent.actor == actor)
        
    return query.order_by(ActivityEvent.id.desc()).limit(limit).all()

@router.get("/{entity_type}/{entity_id}", response_model=List[ActivityEventResponse])
def get_entity_activity(entity_type: str, entity_id: str, db: Session = Depends(get_db)):
    return (
        db.query(ActivityEvent)
        .filter(ActivityEvent.entity_type == entity_type, ActivityEvent.entity_id == entity_id)
        .order_by(ActivityEvent.id.desc())
        .all()
    )
