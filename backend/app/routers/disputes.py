from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import random
from datetime import datetime

from ..database import get_db
from ..models import Dispute, Job, Worker, Customer, ReputationEvent
from ..schemas import DisputeCreate, DisputeResolve, DisputeResponse
from ..services.activity_service import log_activity

router = APIRouter(prefix="/disputes", tags=["Disputes"])

@router.get("", response_model=List[DisputeResponse])
def get_disputes(
    status: Optional[str] = None, # Open, Under Review, Resolved
    worker_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Dispute)
    if status:
        query = query.filter(Dispute.status == status)
    if worker_id:
        query = query.filter(Dispute.worker_id == worker_id)
        
    return query.order_by(Dispute.id.desc()).all()

@router.get("/{dispute_id}", response_model=DisputeResponse)
def get_dispute(dispute_id: str, db: Session = Depends(get_db)):
    if dispute_id.isdigit():
        d = db.query(Dispute).filter(Dispute.id == int(dispute_id)).first()
    else:
        d = db.query(Dispute).filter(Dispute.dispute_id == dispute_id).first()
        
    if not d:
        raise HTTPException(status_code=404, detail="Dispute not found")
    return d

@router.post("", response_model=DisputeResponse, status_code=201)
def create_dispute(payload: DisputeCreate, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == payload.job_id).first()
    if not job:
        raise HTTPException(status_code=400, detail="Referenced job does not exist")
        
    dispute_id = f"DSP-{random.randint(1000, 9999)}"
    dispute = Dispute(
        dispute_id=dispute_id,
        job_id=payload.job_id,
        worker_id=payload.worker_id,
        customer_id=payload.customer_id,
        raised_by=payload.raised_by,
        reason=payload.reason,
        description=payload.description,
        status="Open",
        created_at=datetime.utcnow()
    )
    db.add(dispute)
    
    # Mark job as disputed
    job.status = "Disputed"
    
    # Add reputation notice
    rep_event = ReputationEvent(
        reputation_event_id=f"REP-{random.randint(1000, 9999)}",
        worker_id=payload.worker_id,
        job_id=payload.job_id,
        event_type="Dispute Raised",
        summary=f"Dispute raised: {payload.reason}.",
        impact="Negative",
        confidence="Limited",
        created_at=datetime.utcnow()
    )
    db.add(rep_event)
    
    # Append-only activity log - history is strictly preserved
    log_activity(
        db,
        entity_type="dispute",
        entity_id=dispute.dispute_id,
        event_type="Dispute Raised",
        description=f"Dispute opened on {job.job_id} by {payload.raised_by}: {payload.reason}",
        actor=payload.raised_by.capitalize()
    )
    
    db.commit()
    db.refresh(dispute)
    return dispute

@router.put("/{dispute_id}/resolve", response_model=DisputeResponse)
def resolve_dispute(dispute_id: str, payload: DisputeResolve, db: Session = Depends(get_db)):
    if dispute_id.isdigit():
        d = db.query(Dispute).filter(Dispute.id == int(dispute_id)).first()
    else:
        d = db.query(Dispute).filter(Dispute.dispute_id == dispute_id).first()
        
    if not d:
        raise HTTPException(status_code=404, detail="Dispute not found")
        
    d.status = "Resolved"
    d.resolution = payload.resolution
    d.resolved_at = datetime.utcnow()
    
    # Update linked Job
    if d.job:
        d.job.status = "Resolved"
        
    # Append-only reputation event for resolution
    rep_event = ReputationEvent(
        reputation_event_id=f"REP-{random.randint(1000, 9999)}",
        worker_id=d.worker_id,
        job_id=d.job_id,
        event_type="Dispute Resolved",
        summary=f"Dispute {d.dispute_id} resolved: {payload.resolution}",
        impact="Neutral",
        confidence="Medium",
        created_at=datetime.utcnow()
    )
    db.add(rep_event)
    
    # Append-only activity log
    log_activity(
        db,
        entity_type="dispute",
        entity_id=d.dispute_id,
        event_type="Dispute Resolved",
        description=f"Dispute resolved by {payload.resolved_by}. Resolution: {payload.resolution}",
        actor=payload.resolved_by
    )
    
    db.commit()
    db.refresh(d)
    return d
