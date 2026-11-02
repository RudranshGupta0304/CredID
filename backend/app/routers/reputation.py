from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..models import ReputationEvent, Worker
from ..schemas import ReputationEventResponse
from ..services.reputation_service import compute_worker_reputation_metrics

router = APIRouter(prefix="/reputation", tags=["Reputation"])

@router.get("", response_model=List[ReputationEventResponse])
def get_reputation_events(
    worker_id: Optional[int] = None,
    impact: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(ReputationEvent)
    if worker_id:
        query = query.filter(ReputationEvent.worker_id == worker_id)
    if impact:
        query = query.filter(ReputationEvent.impact == impact)
        
    return query.order_by(ReputationEvent.id.desc()).all()

@router.get("/workers/{worker_id}")
def get_worker_reputation_summary(worker_id: int, db: Session = Depends(get_db)):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
        
    metrics = compute_worker_reputation_metrics(db, worker)
    events = db.query(ReputationEvent).filter(ReputationEvent.worker_id == worker_id).order_by(ReputationEvent.id.desc()).all()
    
    return {
        "worker_id": worker.id,
        "cred_id": worker.cred_id,
        "name": worker.name,
        "role": worker.role,
        "claimed_experience_years": worker.experience_years,
        **metrics,
        "events": events
    }
