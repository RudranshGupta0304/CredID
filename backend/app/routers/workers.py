from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import random
from datetime import datetime, timezone

from ..database import get_db
from ..models import Worker, Job, Feedback, Dispute, BlockchainAnchor
from ..schemas import WorkerCreate, WorkerUpdate, WorkerResponse
from ..services.reputation_service import compute_worker_reputation_metrics
from ..services.activity_service import log_activity
from ..services.auth_service import require_role

router = APIRouter(prefix="/workers", tags=["Workers"])

def enrich_worker_response(db: Session, worker: Worker) -> dict:
    metrics = compute_worker_reputation_metrics(db, worker)
    anchors_count = db.query(BlockchainAnchor).filter(BlockchainAnchor.worker_id == worker.id).count()
    return {
        "id": worker.id,
        "cred_id": worker.cred_id,
        "name": worker.name,
        "photo": worker.photo,
        "role": worker.role,
        "skills": worker.skills,
        "experience_years": worker.experience_years,
        "phone": worker.phone,
        "location": worker.location,
        "bio": worker.bio,
        "verification_status": worker.verification_status,
        "profile_status": worker.profile_status,
        "joined_date": worker.joined_date,
        "created_at": worker.created_at,
        "updated_at": worker.updated_at,
        "verified_jobs_count": metrics["verified_jobs_count"],
        "total_jobs_count": metrics["total_jobs_count"],
        "evidence_supported_jobs_count": metrics["evidence_supported_jobs_count"],
        "average_rating": metrics["average_rating"],
        "credibility_confidence": metrics["credibility_confidence"],
        "confidence_reason": metrics["confidence_reason"],
        "active_disputes_count": metrics["active_disputes_count"],
        "blockchain_anchored_count": anchors_count,
        "integrity_status": "Needs Review" if metrics["active_disputes_count"] > 0 else "Integrity Verified"
    }

@router.get("", response_model=List[WorkerResponse])
def get_workers(
    profession: Optional[str] = None,
    verification_status: Optional[str] = None,
    confidence: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Worker)
    
    if profession:
        query = query.filter(Worker.role.ilike(f"%{profession}%"))
    if verification_status:
        query = query.filter(Worker.verification_status == verification_status)
    if search:
        s = f"%{search}%"
        query = query.filter((Worker.name.ilike(s)) | (Worker.cred_id.ilike(s)) | (Worker.skills.ilike(s)) | (Worker.location.ilike(s)))
        
    workers = query.order_by(Worker.id.asc()).all()
    results = [enrich_worker_response(db, w) for w in workers]
    
    if confidence:
        results = [r for r in results if r["credibility_confidence"].lower() == confidence.lower()]
        
    return results

@router.get("/{worker_id}", response_model=WorkerResponse)
def get_worker(worker_id: int, db: Session = Depends(get_db)):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail=f"Worker with id {worker_id} not found")
    return enrich_worker_response(db, worker)

@router.post("", response_model=WorkerResponse, status_code=201)
def create_worker(
    payload: WorkerCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(require_role(["admin"]))
):
    role_prefix = "SKL"
    if "elec" in payload.role.lower():
        role_prefix = "ELC"
    elif "plumb" in payload.role.lower():
        role_prefix = "PLM"
    elif "carp" in payload.role.lower():
        role_prefix = "CAR"
        
    random_num = random.randint(10000, 99999)
    cred_id = f"CRD-{role_prefix}-{random_num}"
    
    worker = Worker(
        cred_id=cred_id,
        name=payload.name,
        photo=payload.photo or "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80",
        role=payload.role,
        skills=payload.skills,
        experience_years=payload.experience_years,
        phone=payload.phone,
        location=payload.location,
        bio=payload.bio,
        verification_status="Pending Review",
        profile_status="Active",
        joined_date=datetime.now(timezone.utc).strftime("%d %b %Y"),
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    db.add(worker)
    db.commit()
    db.refresh(worker)
    
    log_activity(
        db,
        entity_type="worker",
        entity_id=worker.cred_id,
        event_type="Worker Registered",
        description=f"{worker.name} registered as {worker.role} with {worker.experience_years} years claimed experience.",
        actor=user.get("name", "Admin")
    )
    db.commit()
    
    return enrich_worker_response(db, worker)

@router.put("/{worker_id}", response_model=WorkerResponse)
def update_worker(
    worker_id: int,
    payload: WorkerUpdate,
    db: Session = Depends(get_db),
    user: dict = Depends(require_role(["admin", "worker"]))
):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
        
    update_data = payload.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(worker, field, value)
        
    worker.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(worker)
    
    log_activity(
        db,
        entity_type="worker",
        entity_id=worker.cred_id,
        event_type="Profile Updated",
        description=f"Profile updated for {worker.name} ({worker.cred_id}).",
        actor=user.get("name", "Admin")
    )
    db.commit()
    
    return enrich_worker_response(db, worker)
