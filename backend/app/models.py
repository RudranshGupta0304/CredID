from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from .database import Base

def utcnow():
    return datetime.now(timezone.utc)

class Worker(Base):
    __tablename__ = "workers"

    id = Column(Integer, primary_key=True, index=True)
    cred_id = Column(String(32), unique=True, index=True, nullable=False)
    name = Column(String(128), nullable=False)
    photo = Column(String(256), nullable=True)
    role = Column(String(64), nullable=False) # e.g. Electrician, Plumber
    skills = Column(Text, nullable=False) # comma-separated list
    experience_years = Column(Integer, default=0) # Claimed experience
    phone = Column(String(32), nullable=True)
    location = Column(String(128), nullable=False)
    bio = Column(Text, nullable=True)
    verification_status = Column(String(32), default="Pending Review") # Verified, Pending Review, Needs Review, Unverified
    profile_status = Column(String(32), default="Active") # Active, Inactive
    joined_date = Column(String(32), nullable=True)
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    # Relationships
    jobs = relationship("Job", back_populates="worker", cascade="all, delete-orphan")
    evidence_items = relationship("Evidence", back_populates="worker", cascade="all, delete-orphan")
    feedbacks = relationship("Feedback", back_populates="worker", cascade="all, delete-orphan")
    reputation_events = relationship("ReputationEvent", back_populates="worker", cascade="all, delete-orphan")
    verifications = relationship("Verification", back_populates="worker", cascade="all, delete-orphan")
    disputes = relationship("Dispute", back_populates="worker", cascade="all, delete-orphan")
    blockchain_anchors = relationship("BlockchainAnchor", back_populates="worker", cascade="all, delete-orphan")


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    contact = Column(String(64), nullable=False) # private: not exposed in public credid
    location = Column(String(128), nullable=False) # private: not exposed in public credid
    created_at = Column(DateTime, default=utcnow)

    # Relationships
    jobs = relationship("Job", back_populates="customer")
    feedbacks = relationship("Feedback", back_populates="customer")
    verifications = relationship("Verification", back_populates="customer")
    disputes = relationship("Dispute", back_populates="customer")


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String(32), unique=True, index=True, nullable=False) # e.g. JOB-10482
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    service_type = Column(String(128), nullable=False)
    description = Column(Text, nullable=False)
    location = Column(String(128), nullable=False)
    amount = Column(Float, default=0.0)
    scheduled_date = Column(String(32), nullable=True)
    completed_at = Column(DateTime, nullable=True)
    status = Column(String(32), default="Pending Confirmation") # Draft, Pending Confirmation, Confirmed, Completed, Disputed, Resolved
    interaction_verification_status = Column(String(32), default="Pending") # Pending, Interaction Verified, Evidence Supported, Needs Review
    created_at = Column(DateTime, default=utcnow)

    # Relationships
    worker = relationship("Worker", back_populates="jobs")
    customer = relationship("Customer", back_populates="jobs")
    evidence_items = relationship("Evidence", back_populates="job", cascade="all, delete-orphan")
    feedbacks = relationship("Feedback", back_populates="job", cascade="all, delete-orphan")
    verifications = relationship("Verification", back_populates="job", cascade="all, delete-orphan")
    reputation_events = relationship("ReputationEvent", back_populates="job")
    disputes = relationship("Dispute", back_populates="job")
    blockchain_anchors = relationship("BlockchainAnchor", back_populates="job")


class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(Integer, primary_key=True, index=True)
    evidence_id = Column(String(32), unique=True, index=True, nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=False)
    type = Column(String(64), nullable=False) # completion_photo, invoice_reference, service_description, customer_confirmation, supporting_document
    title = Column(String(128), nullable=False)
    description = Column(Text, nullable=True)
    file_reference = Column(String(256), nullable=False) # Controlled reference / local asset
    verification_status = Column(String(32), default="Pending Review") # Pending Review, Evidence Supported, Needs Review
    created_at = Column(DateTime, default=utcnow)

    # Relationships
    job = relationship("Job", back_populates="evidence_items")
    worker = relationship("Worker", back_populates="evidence_items")


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    feedback_id = Column(String(32), unique=True, index=True, nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    quality = Column(Integer, nullable=False) # 1-5
    reliability = Column(Integer, nullable=False) # 1-5
    timeliness = Column(Integer, nullable=False) # 1-5
    professionalism = Column(Integer, nullable=False) # 1-5
    comment = Column(Text, nullable=True)
    status = Column(String(32), default="Recorded") # Recorded, Under Review, Flagged
    created_at = Column(DateTime, default=utcnow)

    # Relationships
    job = relationship("Job", back_populates="feedbacks")
    worker = relationship("Worker", back_populates="feedbacks")
    customer = relationship("Customer", back_populates="feedbacks")


class ReputationEvent(Base):
    __tablename__ = "reputation_events"

    id = Column(Integer, primary_key=True, index=True)
    reputation_event_id = Column(String(32), unique=True, index=True, nullable=False)
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=True)
    event_type = Column(String(64), nullable=False) # Interaction Confirmed, Evidence Supported, Feedback Recorded, Dispute Raised, Dispute Resolved, Profile Verified
    summary = Column(Text, nullable=False)
    impact = Column(String(32), default="Positive") # Positive, Neutral, Negative
    confidence = Column(String(32), default="Medium") # High, Medium, Limited
    created_at = Column(DateTime, default=utcnow)

    # Relationships
    worker = relationship("Worker", back_populates="reputation_events")
    job = relationship("Job", back_populates="reputation_events")
    blockchain_anchors = relationship("BlockchainAnchor", back_populates="reputation_event")


class Verification(Base):
    __tablename__ = "verifications"

    id = Column(Integer, primary_key=True, index=True)
    verification_id = Column(String(32), unique=True, index=True, nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    status = Column(String(32), default="Pending") # Pending, Interaction Verified, Evidence Supported, Needs Review
    verification_method = Column(String(64), default="Customer Confirmation")
    verified_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)

    # Relationships
    job = relationship("Job", back_populates="verifications")
    worker = relationship("Worker", back_populates="verifications")
    customer = relationship("Customer", back_populates="verifications")


class Dispute(Base):
    __tablename__ = "disputes"

    id = Column(Integer, primary_key=True, index=True)
    dispute_id = Column(String(32), unique=True, index=True, nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    raised_by = Column(String(32), nullable=False) # customer, worker
    reason = Column(String(128), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(32), default="Open") # Open, Under Review, Resolved
    resolution = Column(Text, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utcnow)

    # Relationships
    job = relationship("Job", back_populates="disputes")
    worker = relationship("Worker", back_populates="disputes")
    customer = relationship("Customer", back_populates="disputes")


class ActivityEvent(Base):
    __tablename__ = "activity_events"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String(32), nullable=False) # worker, job, evidence, feedback, verification, dispute, reputation, blockchain_anchor, security
    entity_id = Column(String(64), nullable=False)
    event_type = Column(String(64), nullable=False)
    description = Column(Text, nullable=False)
    actor = Column(String(64), default="System") # Worker, Customer, Admin, System, Security
    created_at = Column(DateTime, default=utcnow)


class BlockchainAnchor(Base):
    __tablename__ = "blockchain_anchors"

    id = Column(Integer, primary_key=True, index=True)
    record_type = Column(String(32), nullable=False) # job_interaction, reputation_event, worker_profile
    record_id = Column(String(64), index=True, nullable=False)
    record_hash = Column(String(64), nullable=False) # SHA-256 canonical hash
    blockchain_network = Column(String(64), default="Configured blockchain testnet or local integrity anchor")
    transaction_reference = Column(String(128), unique=True, index=True, nullable=False)
    block_number = Column(Integer, nullable=True)
    anchored_at = Column(DateTime, default=utcnow)
    verification_status = Column(String(32), default="Anchored") # Anchored, Verified, Integrity Mismatch
    
    # Foreign Keys
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=True)
    worker_id = Column(Integer, ForeignKey("workers.id"), nullable=True)
    reputation_event_id = Column(Integer, ForeignKey("reputation_events.id"), nullable=True)
    
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    # Relationships
    job = relationship("Job", back_populates="blockchain_anchors")
    worker = relationship("Worker", back_populates="blockchain_anchors")
    reputation_event = relationship("ReputationEvent", back_populates="blockchain_anchors")


class UserAccount(Base):
    __tablename__ = "user_accounts"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), unique=True, index=True, nullable=False)
    hashed_password = Column(String(256), nullable=False)
    role = Column(String(32), default="worker") # admin, worker, customer
    linked_worker_id = Column(Integer, ForeignKey("workers.id"), nullable=True)
    linked_customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    created_at = Column(DateTime, default=utcnow)
