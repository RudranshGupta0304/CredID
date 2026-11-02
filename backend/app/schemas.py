from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

# Base model with Pydantic v2 from_attributes support
class SchemaBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

# Activity Schemas
class ActivityEventBase(BaseModel):
    entity_type: str
    entity_id: str
    event_type: str
    description: str
    actor: str = "System"

class ActivityEventResponse(ActivityEventBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime


# Customer Schemas
class CustomerBase(BaseModel):
    name: str
    contact: str
    location: str

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime

# Public safe customer summary (strictly no private phone/address)
class CustomerPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str


# Evidence Schemas
class EvidenceBase(BaseModel):
    type: str
    title: str
    description: Optional[str] = None
    file_reference: str
    verification_status: Optional[str] = "Pending Review"

class EvidenceCreate(EvidenceBase):
    job_id: int
    worker_id: int

class EvidenceResponse(EvidenceBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    evidence_id: str
    job_id: int
    worker_id: int
    created_at: datetime


# Feedback Schemas
class FeedbackCreate(BaseModel):
    job_id: int
    worker_id: int
    customer_id: int
    quality: int = Field(..., ge=1, le=5)
    reliability: int = Field(..., ge=1, le=5)
    timeliness: int = Field(..., ge=1, le=5)
    professionalism: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

class FeedbackResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    feedback_id: str
    job_id: int
    worker_id: int
    customer_id: int
    quality: int
    reliability: int
    timeliness: int
    professionalism: int
    comment: Optional[str]
    status: str
    created_at: datetime


# Verification Schemas
class VerificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    verification_id: str
    job_id: int
    worker_id: int
    customer_id: int
    status: str
    verification_method: str
    verified_at: Optional[datetime]
    notes: Optional[str]

class VerificationReview(BaseModel):
    status: str
    notes: Optional[str] = None
    reviewer: str = "Admin"


# Dispute Schemas
class DisputeCreate(BaseModel):
    job_id: int
    worker_id: int
    customer_id: int
    raised_by: str = "customer"
    reason: str
    description: str

class DisputeResolve(BaseModel):
    resolution: str
    status: str = "Resolved"
    resolved_by: str = "Admin"

class DisputeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    dispute_id: str
    job_id: int
    worker_id: int
    customer_id: int
    raised_by: str
    reason: str
    description: str
    status: str
    resolution: Optional[str]
    resolved_at: Optional[datetime]
    created_at: datetime


# Reputation Event Schemas
class ReputationEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    reputation_event_id: str
    worker_id: int
    job_id: Optional[int]
    event_type: str
    summary: str
    impact: str
    confidence: str
    created_at: datetime


# Blockchain Anchor Schemas
class BlockchainAnchorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    record_type: str
    record_id: str
    record_hash: str
    blockchain_network: str
    transaction_reference: str
    block_number: Optional[int]
    anchored_at: Optional[datetime]
    verification_status: str

class IntegrityVerificationResult(BaseModel):
    is_anchored: bool
    status: str # "Integrity Verified" or "Integrity Mismatch"
    anchored_hash: Optional[str] = None
    current_hash: Optional[str] = None
    matches: bool = False
    blockchain_network: Optional[str] = None
    transaction_reference: Optional[str] = None
    block_number: Optional[int] = None
    anchored_at: Optional[str] = None
    tamper_detected: bool = False
    explanation: str


# Job Schemas
class JobBase(BaseModel):
    worker_id: int
    customer_id: int
    service_type: str
    description: str
    location: str
    amount: float = 0.0
    scheduled_date: Optional[str] = None

class JobCreate(JobBase):
    evidence_title: Optional[str] = None
    evidence_file: Optional[str] = None

class JobUpdate(BaseModel):
    service_type: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    amount: Optional[float] = None
    scheduled_date: Optional[str] = None
    status: Optional[str] = None

class JobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    job_id: str
    worker_id: int
    customer_id: int
    service_type: str
    description: str
    location: str
    amount: float
    scheduled_date: Optional[str]
    completed_at: Optional[datetime]
    status: str
    interaction_verification_status: str
    created_at: datetime
    worker_name: Optional[str] = None
    worker_cred_id: Optional[str] = None
    customer_name: Optional[str] = None
    evidence_count: int = 0
    feedback_count: int = 0
    dispute_count: int = 0
    # Blockchain Integrity info
    blockchain_anchored: bool = False
    transaction_reference: Optional[str] = None
    record_hash: Optional[str] = None
    integrity_status: str = "Pending Anchor"


# Worker Schemas
class WorkerBase(BaseModel):
    name: str
    photo: Optional[str] = None
    role: str
    skills: str
    experience_years: int = 0
    phone: Optional[str] = None
    location: str
    bio: Optional[str] = None

class WorkerCreate(WorkerBase):
    pass

class WorkerUpdate(BaseModel):
    name: Optional[str] = None
    photo: Optional[str] = None
    role: Optional[str] = None
    skills: Optional[str] = None
    experience_years: Optional[int] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    verification_status: Optional[str] = None
    profile_status: Optional[str] = None

class WorkerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    cred_id: str
    name: str
    photo: Optional[str]
    role: str
    skills: str
    experience_years: int
    phone: Optional[str]
    location: str
    bio: Optional[str]
    verification_status: str
    profile_status: str
    joined_date: Optional[str]
    created_at: datetime
    updated_at: datetime
    # Backend derived statistics
    verified_jobs_count: int = 0
    total_jobs_count: int = 0
    evidence_supported_jobs_count: int = 0
    average_rating: Optional[float] = None
    credibility_confidence: str = "Limited History"
    confidence_reason: str = ""
    active_disputes_count: int = 0
    # Integrity info
    blockchain_anchored_count: int = 0
    integrity_status: str = "Integrity Verified"


# Public CredID Profile Schema (Strict privacy: zero customer contact info, zero worker phone)
class PublicCredIDResponse(BaseModel):
    cred_id: str
    name: str
    photo: Optional[str]
    role: str
    skills: List[str]
    claimed_experience_years: int
    location: str
    bio: Optional[str]
    verification_status: str
    credibility_confidence: str
    confidence_explanation: str
    verified_jobs_count: int
    evidence_supported_count: int
    average_rating: Optional[float]
    verified_work_history: List[dict]
    recent_reputation_events: List[dict]
    active_disputes_count: int
    is_suspicious_or_review: bool
    portable_verification_statement: str
    # Blockchain Integrity summary
    blockchain_anchor_status: str
    blockchain_network: str
    latest_anchor_ref: Optional[str] = None
    integrity_verified: bool = True
    integrity_statement: str


# Auth Schemas
class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    username: str
    display_name: str
