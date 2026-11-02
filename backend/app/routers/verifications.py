from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..database import get_db
from ..models import Verification, Job
from ..schemas import VerificationResponse, VerificationReview
from ..services.activity_service import log_activity

router = APIRouter(prefix="/verifications", tags=["Verifications"])

@router.get("", response_model=List[VerificationResponse])
def get_verifications(
    status: Optional[str] = None, # Pending, Interaction Verified, Evidence Supported, Needs Review
    worker_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Verification)
    if status:
        query = query.filter(Verification.status == status)
    if worker_id:
        query = query.filter(Verification.worker_id == worker_id)
        
    return query.order_by(Verification.id.desc()).all()

@router.get("/{verification_id}", response_model=VerificationResponse)
def get_verification(verification_id: str, db: Session = Depends(get_db)):
    if verification_id.isdigit():
        verif = db.query(Verification).filter(Verification.id == int(verification_id)).first()
    else:
        verif = db.query(Verification).filter(Verification.verification_id == verification_id).first()
        
    if not verif:
        raise HTTPException(status_code=404, detail="Verification record not found")
    return verif

@router.post("/{verification_id}/review", response_model=VerificationResponse)
def review_verification(
    verification_id: str,
    payload: VerificationReview,
    db: Session = Depends(get_db)
):
    if verification_id.isdigit():
        verif = db.query(Verification).filter(Verification.id == int(verification_id)).first()
    else:
        verif = db.query(Verification).filter(Verification.verification_id == verification_id).first()
        
    if not verif:
        raise HTTPException(status_code=404, detail="Verification record not found")
        
    verif.status = payload.status
    verif.verified_at = datetime.utcnow()
    if payload.notes:
        verif.notes = payload.notes
        
    # Reflect into linked Job
    if verif.job:
        verif.job.interaction_verification_status = payload.status
        if payload.status in ["Interaction Verified", "Evidence Supported"] and verif.job.status == "Pending Confirmation":
            verif.job.status = "Confirmed"
            
    # Log append-only activity
    log_activity(
        db,
        entity_type="verification",
        entity_id=verif.verification_id,
        event_type="Verification Reviewed",
        description=f"Verification status updated to '{payload.status}'. Notes: {payload.notes or 'None'}",
        actor=payload.reviewer
    )
    
    db.commit()
    db.refresh(verif)
    return verif
