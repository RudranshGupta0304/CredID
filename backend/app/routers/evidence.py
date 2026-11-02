from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import random
from datetime import datetime

from ..database import get_db
from ..models import Evidence, Job, Worker
from ..schemas import EvidenceCreate, EvidenceResponse
from ..services.activity_service import log_activity

router = APIRouter(prefix="/evidence", tags=["Evidence"])

@router.get("", response_model=List[EvidenceResponse])
def get_evidence_list(
    job_id: Optional[int] = None,
    worker_id: Optional[int] = None,
    evidence_type: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Evidence)
    if job_id:
        query = query.filter(Evidence.job_id == job_id)
    if worker_id:
        query = query.filter(Evidence.worker_id == worker_id)
    if evidence_type:
        query = query.filter(Evidence.type == evidence_type)
    if status:
        query = query.filter(Evidence.verification_status == status)
        
    return query.order_by(Evidence.id.desc()).all()

@router.get("/{evidence_id}", response_model=EvidenceResponse)
def get_evidence(evidence_id: str, db: Session = Depends(get_db)):
    if evidence_id.isdigit():
        item = db.query(Evidence).filter(Evidence.id == int(evidence_id)).first()
    else:
        item = db.query(Evidence).filter(Evidence.evidence_id == evidence_id).first()
        
    if not item:
        raise HTTPException(status_code=404, detail="Evidence not found")
    return item

@router.post("", response_model=EvidenceResponse, status_code=201)
def create_evidence(payload: EvidenceCreate, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == payload.job_id).first()
    if not job:
        raise HTTPException(status_code=400, detail="Target job does not exist")
        
    worker = db.query(Worker).filter(Worker.id == payload.worker_id).first()
    if not worker:
        raise HTTPException(status_code=400, detail="Target worker does not exist")
        
    evidence_id = f"EVD-{random.randint(1000, 9999)}"
    evidence = Evidence(
        evidence_id=evidence_id,
        job_id=payload.job_id,
        worker_id=payload.worker_id,
        type=payload.type,
        title=payload.title,
        description=payload.description,
        file_reference=payload.file_reference,
        verification_status="Evidence Supported", # Mark as supported upon documentation attachment
        created_at=datetime.utcnow()
    )
    db.add(evidence)
    
    # If job was already Interaction Verified or Confirmed, advance its interaction verification status to Evidence Supported
    if job.interaction_verification_status in ["Interaction Verified", "Pending"]:
        job.interaction_verification_status = "Evidence Supported"
        
    # Log append-only activity
    log_activity(
        db,
        entity_type="evidence",
        entity_id=evidence.evidence_id,
        event_type="Evidence Attached",
        description=f"Evidence '{evidence.title}' ({evidence.type}) attached to {job.job_id}.",
        actor="Worker"
    )
    
    db.commit()
    db.refresh(evidence)
    return evidence
