from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import random
from datetime import datetime, timezone

from ..database import get_db
from ..models import Job, Worker, Customer, Evidence, Verification, ReputationEvent, BlockchainAnchor
from ..schemas import JobCreate, JobUpdate, JobResponse
from ..services.activity_service import log_activity
from ..services.blockchain_service import anchor_job_interaction
from ..services.auth_service import require_role

router = APIRouter(prefix="/jobs", tags=["Jobs"])

def enrich_job_response(db: Session, job: Job) -> dict:
    anchor = (
        db.query(BlockchainAnchor)
        .filter(BlockchainAnchor.record_type == "job_interaction", BlockchainAnchor.record_id == job.job_id)
        .first()
    )
    return {
        "id": job.id,
        "job_id": job.job_id,
        "worker_id": job.worker_id,
        "customer_id": job.customer_id,
        "service_type": job.service_type,
        "description": job.description,
        "location": job.location,
        "amount": job.amount,
        "scheduled_date": job.scheduled_date,
        "completed_at": job.completed_at,
        "status": job.status,
        "interaction_verification_status": job.interaction_verification_status,
        "created_at": job.created_at,
        "worker_name": job.worker.name if job.worker else "Unknown Worker",
        "worker_cred_id": job.worker.cred_id if job.worker else "N/A",
        "customer_name": job.customer.name if job.customer else "Unknown Customer",
        "evidence_count": len(job.evidence_items),
        "feedback_count": len(job.feedbacks),
        "dispute_count": len(job.disputes),
        "blockchain_anchored": anchor is not None,
        "transaction_reference": anchor.transaction_reference if anchor else None,
        "record_hash": anchor.record_hash if anchor else None,
        "integrity_status": "Integrity Verified" if anchor else "Pending Anchor"
    }

@router.get("", response_model=List[JobResponse])
def get_jobs(
    worker_id: Optional[int] = None,
    customer_id: Optional[int] = None,
    service: Optional[str] = None,
    status: Optional[str] = None,
    verification_status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Job)
    
    if worker_id:
        query = query.filter(Job.worker_id == worker_id)
    if customer_id:
        query = query.filter(Job.customer_id == customer_id)
    if service:
        query = query.filter(Job.service_type.ilike(f"%{service}%"))
    if status:
        query = query.filter(Job.status == status)
    if verification_status:
        query = query.filter(Job.interaction_verification_status == verification_status)
    if search:
        s = f"%{search}%"
        query = query.filter((Job.job_id.ilike(s)) | (Job.service_type.ilike(s)) | (Job.description.ilike(s)) | (Job.location.ilike(s)))
        
    jobs = query.order_by(Job.id.desc()).all()
    return [enrich_job_response(db, j) for j in jobs]

@router.get("/{job_id_or_number}", response_model=JobResponse)
def get_job(job_id_or_number: str, db: Session = Depends(get_db)):
    if job_id_or_number.isdigit():
        job = db.query(Job).filter(Job.id == int(job_id_or_number)).first()
    else:
        job = db.query(Job).filter(Job.job_id == job_id_or_number).first()
        
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return enrich_job_response(db, job)

@router.post("", response_model=JobResponse, status_code=201)
def create_job(
    payload: JobCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(require_role(["admin", "worker"]))
):
    worker = db.query(Worker).filter(Worker.id == payload.worker_id).first()
    if not worker:
        raise HTTPException(status_code=400, detail="Specified worker does not exist")
        
    customer = db.query(Customer).filter(Customer.id == payload.customer_id).first()
    if not customer:
        raise HTTPException(status_code=400, detail="Specified customer does not exist")
        
    job_num = random.randint(10000, 99999)
    job_id_str = f"JOB-{job_num}"
    
    job = Job(
        job_id=job_id_str,
        worker_id=payload.worker_id,
        customer_id=payload.customer_id,
        service_type=payload.service_type,
        description=payload.description,
        location=payload.location,
        amount=payload.amount,
        scheduled_date=payload.scheduled_date or datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        status="Pending Confirmation",
        interaction_verification_status="Pending",
        created_at=datetime.now(timezone.utc)
    )
    db.add(job)
    db.flush()
    
    verif = Verification(
        verification_id=f"VRF-{random.randint(1000, 9999)}",
        job_id=job.id,
        worker_id=worker.id,
        customer_id=customer.id,
        status="Pending",
        verification_method="Customer Digital Confirmation",
        notes="Awaiting customer verification of service interaction"
    )
    db.add(verif)
    
    if payload.evidence_title:
        evidence = Evidence(
            evidence_id=f"EVD-{random.randint(1000, 9999)}",
            job_id=job.id,
            worker_id=worker.id,
            type="completion_photo",
            title=payload.evidence_title,
            file_reference=payload.evidence_file or "evidence/work_evidence_placeholder.jpg",
            verification_status="Pending Review",
            created_at=datetime.now(timezone.utc)
        )
        db.add(evidence)
        
    log_activity(
        db,
        entity_type="job",
        entity_id=job.job_id,
        event_type="Job Created",
        description=f"Job {job.job_id} ({job.service_type}) recorded. Status: Pending Confirmation by customer {customer.name}.",
        actor=user.get("name", "Worker")
    )
    
    db.commit()
    db.refresh(job)
    return enrich_job_response(db, job)

@router.post("/{job_id_or_number}/confirm", response_model=JobResponse)
def confirm_job(
    job_id_or_number: str,
    db: Session = Depends(get_db),
    user: dict = Depends(require_role(["admin", "customer"]))
):
    """
    Customer confirms the service interaction occurred.
    Immediately creates a traceable Reputation Event and anchors the canonical
    interaction hash to the blockchain integrity ledger.
    """
    if job_id_or_number.isdigit():
        job = db.query(Job).filter(Job.id == int(job_id_or_number)).first()
    else:
        job = db.query(Job).filter(Job.job_id == job_id_or_number).first()
        
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    job.status = "Confirmed"
    if len(job.evidence_items) > 0:
        job.interaction_verification_status = "Evidence Supported"
    else:
        job.interaction_verification_status = "Interaction Verified"
        
    job.completed_at = datetime.now(timezone.utc)
    
    verif = db.query(Verification).filter(Verification.job_id == job.id).first()
    if verif:
        verif.status = job.interaction_verification_status
        verif.verified_at = datetime.now(timezone.utc)
        verif.notes = f"Confirmed by customer {job.customer.name} via digital verification."
    else:
        verif = Verification(
            verification_id=f"VRF-{random.randint(1000, 9999)}",
            job_id=job.id,
            worker_id=job.worker_id,
            customer_id=job.customer_id,
            status=job.interaction_verification_status,
            verification_method="Customer Digital Confirmation",
            verified_at=datetime.now(timezone.utc),
            notes=f"Confirmed by customer {job.customer.name}."
        )
        db.add(verif)
        
    rep_event = ReputationEvent(
        reputation_event_id=f"REP-{random.randint(1000, 9999)}",
        worker_id=job.worker_id,
        job_id=job.id,
        event_type="Interaction Confirmed",
        summary=f"Customer {job.customer.name} confirmed service delivery for {job.service_type}.",
        impact="Positive",
        confidence="Medium",
        created_at=datetime.now(timezone.utc)
    )
    db.add(rep_event)
    db.flush()
    
    # Automatically anchor canonical verified job hash to blockchain integrity layer
    anchor_job_interaction(db, job, rep_event)

    log_activity(
        db,
        entity_type="job",
        entity_id=job.job_id,
        event_type="Customer Confirmed",
        description=f"Customer {job.customer.name} confirmed job {job.job_id}. Interaction status is now '{job.interaction_verification_status}'. Anchored to blockchain integrity ledger.",
        actor=user.get("name", "Customer")
    )
    
    db.commit()
    db.refresh(job)
    return enrich_job_response(db, job)

@router.post("/{job_id_or_number}/complete", response_model=JobResponse)
def complete_job(
    job_id_or_number: str,
    db: Session = Depends(get_db),
    user: dict = Depends(require_role(["admin", "worker"]))
):
    if job_id_or_number.isdigit():
        job = db.query(Job).filter(Job.id == int(job_id_or_number)).first()
    else:
        job = db.query(Job).filter(Job.job_id == job_id_or_number).first()
        
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    job.status = "Completed"
    if not job.completed_at:
        job.completed_at = datetime.now(timezone.utc)
        
    log_activity(
        db,
        entity_type="job",
        entity_id=job.job_id,
        event_type="Job Completed",
        description=f"Job {job.job_id} marked as completed by worker.",
        actor=user.get("name", "Worker")
    )
    db.commit()
    db.refresh(job)
    return enrich_job_response(db, job)
