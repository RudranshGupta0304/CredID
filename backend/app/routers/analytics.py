from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import Worker, Job, Verification, Dispute, ReputationEvent, Evidence

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("")
def get_analytics(db: Session = Depends(get_db)):
    """
    Returns database-driven metrics.
    Clearly labelled 'Prototype Analytics'. Never fake hardcoded stats.
    """
    total_workers = db.query(Worker).count()
    verified_workers = db.query(Worker).filter(Worker.verification_status == "Verified").count()
    total_jobs = db.query(Job).count()
    
    verified_jobs = db.query(Job).filter(
        Job.interaction_verification_status.in_(["Interaction Verified", "Evidence Supported"])
    ).count()
    
    evidence_supported_jobs = db.query(Job).filter(
        Job.interaction_verification_status == "Evidence Supported"
    ).count()
    
    pending_verifications = db.query(Verification).filter(Verification.status == "Pending").count()
    open_disputes = db.query(Dispute).filter(Dispute.status.in_(["Open", "Under Review"])).count()
    total_evidence = db.query(Evidence).count()
    total_reputation_events = db.query(ReputationEvent).count()
    
    # Jobs grouped by service type
    jobs_by_service_raw = (
        db.query(Job.service_type, func.count(Job.id))
        .group_by(Job.service_type)
        .all()
    )
    jobs_by_service = [{"service": s, "count": c} for s, c in jobs_by_service_raw]
    
    # Verification status breakdown
    verif_status_raw = (
        db.query(Verification.status, func.count(Verification.id))
        .group_by(Verification.status)
        .all()
    )
    verification_breakdown = [{"status": s, "count": c} for s, c in verif_status_raw]
    
    return {
        "is_prototype": True,
        "environment_label": "CredID Prototype / Demo Data",
        "metrics": {
            "total_workers": total_workers,
            "verified_workers": verified_workers,
            "total_jobs": total_jobs,
            "verified_jobs": verified_jobs,
            "evidence_supported_jobs": evidence_supported_jobs,
            "pending_verifications": pending_verifications,
            "open_disputes": open_disputes,
            "total_evidence_records": total_evidence,
            "total_reputation_events": total_reputation_events
        },
        "jobs_by_service": jobs_by_service,
        "verification_breakdown": verification_breakdown
    }
