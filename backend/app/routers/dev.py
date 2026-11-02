from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db, Base, engine
from ..models import Worker, Job, Verification, Dispute, ReputationEvent, Evidence, BlockchainAnchor
from ..seed import seed_database
from ..services.auth_service import require_role

router = APIRouter(prefix="/dev", tags=["Development / Demo Tools"])

@router.post("/reset")
def reset_database(
    db: Session = Depends(get_db),
    user: dict = Depends(require_role(["admin"]))
):
    """
    Development/Demo Reset mechanism.
    Protected behind admin authorization and confirmation in the UI.
    Clears all tables, recreates schema, and reseeds initial demo state.
    """
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    seed_database(db)
    
    return {
        "status": "success",
        "message": "Demo database successfully reset and reseeded with blockchain anchors.",
        "environment": "Prototype / Demo Mode"
    }

@router.post("/simulate-tamper/{job_id_or_number}")
def simulate_tampering_for_testing(
    job_id_or_number: str,
    db: Session = Depends(get_db),
    user: dict = Depends(require_role(["admin"]))
):
    """
    TESTING UTILITY for Requirements 7 & 17:
    Simulates unauthorized out-of-band direct database modification on a protected job
    (e.g., arbitrarily changing the service type or amount without going through the confirmation workflow),
    to verify that the Blockchain Integrity Service immediately flags 'Integrity Mismatch / Needs Review'.
    """
    if job_id_or_number.isdigit():
        job = db.query(Job).filter(Job.id == int(job_id_or_number)).first()
    else:
        job = db.query(Job).filter(Job.job_id == job_id_or_number).first()
        
    if not job:
        return {"error": "Job not found"}

    original_service = job.service_type
    job.service_type = job.service_type + " [UNAUTHORIZED DB EDIT]"
    job.amount = job.amount + 5000.0
    db.commit()

    return {
        "status": "tampered",
        "job_id": job.job_id,
        "original_service": original_service,
        "tampered_service": job.service_type,
        "message": "Direct database modification simulated. Run integrity check to observe mismatch detection."
    }
