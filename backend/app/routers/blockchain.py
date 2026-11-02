from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..models import BlockchainAnchor, Job, Worker
from ..schemas import BlockchainAnchorResponse, IntegrityVerificationResult
from ..services.blockchain_service import verify_job_integrity, anchor_job_interaction
from ..services.auth_service import require_auth, require_role

router = APIRouter(prefix="/blockchain", tags=["Blockchain Integrity Layer"])

@router.get("/anchors", response_model=List[BlockchainAnchorResponse])
def get_blockchain_anchors(
    record_type: Optional[str] = None,
    worker_id: Optional[int] = None,
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    user: dict = Depends(require_auth)
):
    query = db.query(BlockchainAnchor)
    if record_type:
        query = query.filter(BlockchainAnchor.record_type == record_type)
    if worker_id:
        query = query.filter(BlockchainAnchor.worker_id == worker_id)
        
    return query.order_by(BlockchainAnchor.id.desc()).limit(limit).all()

@router.get("/verify/job/{job_id_or_number}", response_model=IntegrityVerificationResult)
def verify_job_blockchain_integrity(
    job_id_or_number: str,
    db: Session = Depends(get_db)
):
    """
    Independent cryptographic integrity verification endpoint.
    Retrieves current active job record, re-computes canonical SHA-256 hash,
    and compares it against the anchored blockchain state.
    """
    if job_id_or_number.isdigit():
        job = db.query(Job).filter(Job.id == int(job_id_or_number)).first()
    else:
        job = db.query(Job).filter(Job.job_id == job_id_or_number).first()
        
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    return verify_job_integrity(db, job)

@router.post("/anchor/job/{job_id_or_number}", response_model=BlockchainAnchorResponse)
def trigger_manual_job_anchor(
    job_id_or_number: str,
    db: Session = Depends(get_db),
    user: dict = Depends(require_role(["admin", "worker"]))
):
    """
    Explicitly anchors a verified job to the blockchain integrity ledger.
    Restricted to authorized roles.
    """
    if job_id_or_number.isdigit():
        job = db.query(Job).filter(Job.id == int(job_id_or_number)).first()
    else:
        job = db.query(Job).filter(Job.job_id == job_id_or_number).first()
        
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    anchor = anchor_job_interaction(db, job)
    db.commit()
    db.refresh(anchor)
    return anchor
