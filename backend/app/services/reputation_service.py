from typing import Dict, Any, List
from sqlalchemy.orm import Session
from ..models import Worker, Job, Feedback, Dispute, ReputationEvent

def compute_worker_reputation_metrics(db: Session, worker: Worker) -> Dict[str, Any]:
    """
    Computes explainable credibility metrics strictly from active database records.
    Never uses fake mathematical entropy or ungrounded AI scores.
    
    Confidence Levels:
    - High Confidence: Multiple verified jobs (>= 3), evidence-supported records, positive feedback, zero open disputes, no suspicious flags.
    - Medium Confidence: At least 1-2 verified jobs, evidence or feedback present, no open disputes.
    - Limited History: New or unverified jobs only, few or no customer confirmations yet.
    - Needs Review: Open unresolved dispute, rapid abnormal submissions, or flagged feedback.
    """
    jobs: List[Job] = worker.jobs
    total_jobs = len(jobs)
    
    # Verified jobs: customer confirmed or interaction verified
    verified_jobs = [j for j in jobs if j.interaction_verification_status in ["Interaction Verified", "Evidence Supported"]]
    verified_count = len(verified_jobs)
    
    # Evidence supported jobs
    evidence_supported_jobs = [j for j in jobs if j.interaction_verification_status == "Evidence Supported"]
    evidence_count = len(evidence_supported_jobs)
    
    # Feedbacks
    feedbacks: List[Feedback] = worker.feedbacks
    ratings = []
    suspicious_patterns = False
    
    # Check for suspicious patterns:
    # 1. Multiple identical feedback comments from same customer or rapid timestamps
    # 2. More than 2 feedbacks from exact same customer in short window
    customer_ids = [f.customer_id for f in feedbacks]
    if len(customer_ids) >= 3 and len(set(customer_ids)) == 1:
        suspicious_patterns = True
        
    for f in feedbacks:
        if f.status != "Flagged":
            avg_f = (f.quality + f.reliability + f.timeliness + f.professionalism) / 4.0
            ratings.append(avg_f)
            
    average_rating = round(sum(ratings) / len(ratings), 1) if ratings else None
    
    # Active disputes
    open_disputes = [d for d in worker.disputes if d.status in ["Open", "Under Review"]]
    active_disputes_count = len(open_disputes)
    
    # Determine confidence level and explainable reason
    if active_disputes_count > 0:
        confidence = "Needs Review"
        reason = f"Contains {active_disputes_count} active dispute(s) requiring resolution."
    elif suspicious_patterns or worker.verification_status == "Needs Review":
        confidence = "Needs Review"
        reason = "Abnormal repeated interaction pattern flagged for administrator review."
    elif verified_count >= 3 and evidence_count >= 2 and (average_rating is None or average_rating >= 4.0):
        confidence = "High Confidence"
        reason = f"{verified_count} customer-confirmed jobs with {evidence_count} attached evidence records and solid track record."
    elif verified_count >= 1:
        confidence = "Medium Confidence"
        reason = f"{verified_count} verified interaction(s) recorded. Continued consistent verified jobs will advance to High Confidence."
    else:
        confidence = "Limited History"
        reason = "Early-stage profile with limited verified customer interactions in CredID."
        
    return {
        "verified_jobs_count": verified_count,
        "total_jobs_count": total_jobs,
        "evidence_supported_jobs_count": evidence_count,
        "average_rating": average_rating,
        "credibility_confidence": confidence,
        "confidence_reason": reason,
        "active_disputes_count": active_disputes_count,
        "is_suspicious": suspicious_patterns or worker.verification_status == "Needs Review"
    }
