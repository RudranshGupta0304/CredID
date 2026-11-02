from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import random
from datetime import datetime

from ..database import get_db
from ..models import Feedback, Job, Worker, Customer, ReputationEvent
from ..schemas import FeedbackCreate, FeedbackResponse
from ..services.activity_service import log_activity

router = APIRouter(prefix="/feedback", tags=["Feedback"])

@router.get("", response_model=List[FeedbackResponse])
def get_feedback_list(
    job_id: Optional[int] = None,
    worker_id: Optional[int] = None,
    customer_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Feedback)
    if job_id:
        query = query.filter(Feedback.job_id == job_id)
    if worker_id:
        query = query.filter(Feedback.worker_id == worker_id)
    if customer_id:
        query = query.filter(Feedback.customer_id == customer_id)
    if status:
        query = query.filter(Feedback.status == status)
        
    return query.order_by(Feedback.id.desc()).all()

@router.post("", response_model=FeedbackResponse, status_code=201)
def submit_feedback(payload: FeedbackCreate, db: Session = Depends(get_db)):
    # Validate job exists
    job = db.query(Job).filter(Job.id == payload.job_id).first()
    if not job:
        raise HTTPException(status_code=400, detail="Referenced job does not exist")
        
    # Validate worker matches job
    if job.worker_id != payload.worker_id:
        raise HTTPException(status_code=400, detail="Worker ID does not match job's assigned worker")
        
    # Validate customer matches job
    if job.customer_id != payload.customer_id:
        raise HTTPException(status_code=400, detail="Customer ID does not match job's customer")
        
    feedback_id = f"FDB-{random.randint(1000, 9999)}"
    feedback = Feedback(
        feedback_id=feedback_id,
        job_id=payload.job_id,
        worker_id=payload.worker_id,
        customer_id=payload.customer_id,
        quality=payload.quality,
        reliability=payload.reliability,
        timeliness=payload.timeliness,
        professionalism=payload.professionalism,
        comment=payload.comment,
        status="Recorded",
        created_at=datetime.utcnow()
    )
    db.add(feedback)
    
    # Calculate score
    avg_score = (payload.quality + payload.reliability + payload.timeliness + payload.professionalism) / 4.0
    impact = "Positive" if avg_score >= 3.5 else "Neutral" if avg_score >= 2.5 else "Negative"
    
    # Create matching Reputation Event
    rep_event = ReputationEvent(
        reputation_event_id=f"REP-{random.randint(1000, 9999)}",
        worker_id=payload.worker_id,
        job_id=payload.job_id,
        event_type="Feedback Recorded",
        summary=f"Structured customer rating {avg_score:.1f}/5 recorded for {job.service_type}.",
        impact=impact,
        confidence="High" if avg_score >= 4.0 else "Medium",
        created_at=datetime.utcnow()
    )
    db.add(rep_event)
    
    # Log append-only activity
    log_activity(
        db,
        entity_type="feedback",
        entity_id=feedback.feedback_id,
        event_type="Feedback Submitted",
        description=f"Customer submitted rating ({avg_score:.1f}/5) for {job.job_id}.",
        actor="Customer"
    )
    
    db.commit()
    db.refresh(feedback)
    return feedback
