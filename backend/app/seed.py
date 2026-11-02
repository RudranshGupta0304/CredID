from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from .models import (
    Worker, Customer, Job, Evidence, Feedback, ReputationEvent,
    Verification, Dispute, ActivityEvent, BlockchainAnchor, UserAccount
)
from .services.hashing_service import compute_record_hash
from .services.auth_service import get_password_hash
from .services.blockchain_service import anchor_job_interaction

def utcnow():
    return datetime.now(timezone.utc)

def seed_database(db: Session):
    """
    Seeds the SQLite database with realistic prototype records.
    Provides Amit Sharma (CRD-ELC-20481), Rajesh Kumar, Priya Patel, Vikram Singh, and Suman Das.
    Creates demo user accounts with bcrypt hashes.
    Anchors verified jobs to the blockchain integrity ledger.
    """
    if db.query(Worker).first():
        return

    now = utcnow()
    
    # 1. Seed Workers
    w1 = Worker(
        cred_id="CRD-ELC-20481",
        name="Amit Sharma",
        photo="https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&auto=format&fit=crop&q=80",
        role="Licensed Electrician",
        skills="Residential Wiring, MCB Tripping, Inverter Installation, Industrial Panel Servicing",
        experience_years=7, # 7 years claimed experience
        phone="+91 98201 44892",
        location="Sector 14, Gurugram, NCR",
        bio="Experienced residential and commercial electrician with 7 years in electrical installations. Specializes in rapid fault-finding and clean distribution board setup.",
        verification_status="Verified",
        profile_status="Active",
        joined_date="15 Jan 2024",
        created_at=now - timedelta(days=90)
    )

    w2 = Worker(
        cred_id="CRD-PLM-10923",
        name="Rajesh Kumar",
        photo="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
        role="Master Plumber",
        skills="Pipeline Leak Detection, Sanitary Fitting, Overhead Tank Plumbing, RO Filtration Setup",
        experience_years=5,
        phone="+91 98112 30948",
        location="Indirapuram, Ghaziabad",
        bio="Certified plumbing technician with 5 years field experience across high-rise apartments and residential villas.",
        verification_status="Verified",
        profile_status="Active",
        joined_date="02 Feb 2024",
        created_at=now - timedelta(days=75)
    )

    w3 = Worker(
        cred_id="CRD-CAR-30114",
        name="Priya Patel",
        photo="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
        role="Custom Woodwork & Carpentry",
        skills="Modular Cabinetry, Door Alignment, Antique Furniture Restoration, Hardware Installation",
        experience_years=4,
        phone="+91 97234 88192",
        location="Koramangala, Bengaluru",
        bio="Artisan carpenter creating durable, precision-crafted fixtures and custom furniture restoration.",
        verification_status="Verified",
        profile_status="Active",
        joined_date="10 Mar 2024",
        created_at=now - timedelta(days=50)
    )

    w4 = Worker(
        cred_id="CRD-ELC-50912",
        name="Vikram Singh",
        photo="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
        role="Junior Electrician",
        skills="Appliance Wiring, Socket Replacement, Lighting Installation",
        experience_years=2,
        phone="+91 99104 22194",
        location="Malviya Nagar, Jaipur",
        bio="Recent technical institute graduate offering quick response appliance repairs and domestic electrical work.",
        verification_status="Pending Review",
        profile_status="Active",
        joined_date="01 Oct 2024",
        created_at=now - timedelta(days=12)
    )

    w5 = Worker(
        cred_id="CRD-PLM-88201",
        name="Suman Das",
        photo="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
        role="Domestic Plumber",
        skills="Drain Cleaning, Tap Replacement",
        experience_years=3,
        phone="+91 98450 77123",
        location="Salt Lake, Kolkata",
        bio="Local plumbing service contractor.",
        verification_status="Needs Review",
        profile_status="Active",
        joined_date="14 Sep 2024",
        created_at=now - timedelta(days=35)
    )

    db.add_all([w1, w2, w3, w4, w5])
    db.flush()

    # 2. Seed Customers
    c1 = Customer(
        name="Sunita Verma",
        contact="+91 98101 23456",
        location="Apartment 4B, Palm Grove, DLF Phase 1, Gurugram",
        created_at=now - timedelta(days=80)
    )
    c2 = Customer(
        name="Ramesh Rao",
        contact="+91 98202 34567",
        location="House 12, South City II, Gurugram",
        created_at=now - timedelta(days=60)
    )
    c3 = Customer(
        name="Anita Joshi",
        contact="+91 98303 45678",
        location="Flat 802, Prestige Tower, Indirapuram",
        created_at=now - timedelta(days=45)
    )
    c4 = Customer(
        name="Deepak Gupta",
        contact="+91 98404 56789",
        location="Villa 34, Green Acres, Koramangala, Bengaluru",
        created_at=now - timedelta(days=30)
    )

    db.add_all([c1, c2, c3, c4])
    db.flush()

    # 3. Seed Demo Users with Secure Bcrypt Hashed Passwords
    u_admin = UserAccount(
        username="admin",
        hashed_password=get_password_hash("admin123"),
        role="admin"
    )
    u_worker = UserAccount(
        username="amit",
        hashed_password=get_password_hash("worker123"),
        role="worker",
        linked_worker_id=w1.id
    )
    u_customer = UserAccount(
        username="sunita",
        hashed_password=get_password_hash("customer123"),
        role="customer",
        linked_customer_id=c1.id
    )
    db.add_all([u_admin, u_worker, u_customer])
    db.flush()

    # 4. Seed Jobs
    j1 = Job(
        job_id="JOB-10482",
        worker_id=w1.id,
        customer_id=c1.id,
        service_type="Distribution Board & MCB Rewiring",
        description="Diagnosed tripping 63A main MCB, balanced phase loads across 3 circuits, and replaced burnt isolator switch.",
        location="DLF Phase 1, Gurugram",
        amount=2850.0,
        scheduled_date=(now - timedelta(days=20)).strftime("%Y-%m-%d"),
        completed_at=now - timedelta(days=20),
        status="Completed",
        interaction_verification_status="Evidence Supported",
        created_at=now - timedelta(days=21)
    )

    j2 = Job(
        job_id="JOB-10483",
        worker_id=w1.id,
        customer_id=c2.id,
        service_type="Inverter Backup System Integration",
        description="Installed Luminous 1100VA hybrid inverter with dedicated sub-panel wiring for emergency lighting.",
        location="South City II, Gurugram",
        amount=3500.0,
        scheduled_date=(now - timedelta(days=10)).strftime("%Y-%m-%d"),
        completed_at=now - timedelta(days=10),
        status="Completed",
        interaction_verification_status="Evidence Supported",
        created_at=now - timedelta(days=11)
    )

    j3 = Job(
        job_id="JOB-10484",
        worker_id=w1.id,
        customer_id=c3.id,
        service_type="Kitchen Exhaust & Appliance Rewiring",
        description="Concealed conduit wiring for 15A chimney switch and safety earth terminal testing.",
        location="Indirapuram, Ghaziabad",
        amount=1600.0,
        scheduled_date=(now - timedelta(days=2)).strftime("%Y-%m-%d"),
        completed_at=None,
        status="Pending Confirmation",
        interaction_verification_status="Pending",
        created_at=now - timedelta(days=2)
    )

    j4 = Job(
        job_id="JOB-10485",
        worker_id=w2.id,
        customer_id=c3.id,
        service_type="Concealed Bathroom Pipeline Leak Repair",
        description="Detected internal wall seepage using acoustic probe, replaced cracked 1-inch CPVC elbow, and sealed pressure joints.",
        location="Prestige Tower, Indirapuram",
        amount=3200.0,
        scheduled_date=(now - timedelta(days=15)).strftime("%Y-%m-%d"),
        completed_at=now - timedelta(days=15),
        status="Completed",
        interaction_verification_status="Evidence Supported",
        created_at=now - timedelta(days=16)
    )

    j5 = Job(
        job_id="JOB-10486",
        worker_id=w3.id,
        customer_id=c4.id,
        service_type="Custom Teakwood Shelving & Hinge Realignment",
        description="Precision installation of 4 floating wall shelves with internal concealed steel studs and soft-close hinges.",
        location="Villa 34, Green Acres, Koramangala",
        amount=4500.0,
        scheduled_date=(now - timedelta(days=8)).strftime("%Y-%m-%d"),
        completed_at=now - timedelta(days=8),
        status="Completed",
        interaction_verification_status="Interaction Verified",
        created_at=now - timedelta(days=9)
    )

    j6 = Job(
        job_id="JOB-10487",
        worker_id=w4.id,
        customer_id=c2.id,
        service_type="LED Panel Ceiling Lights Installation",
        description="Fitted six 12W warm white recess spotlights with clean ceiling cutout.",
        location="Malviya Nagar, Jaipur",
        amount=900.0,
        scheduled_date=(now - timedelta(days=4)).strftime("%Y-%m-%d"),
        completed_at=now - timedelta(days=4),
        status="Completed",
        interaction_verification_status="Pending",
        created_at=now - timedelta(days=5)
    )

    j7 = Job(
        job_id="JOB-10488",
        worker_id=w5.id,
        customer_id=c1.id,
        service_type="Kitchen Sink Mixer Replacement",
        description="Replaced dual swivel mixer tap and flex pipes.",
        location="Sector 14, Gurugram",
        amount=1400.0,
        scheduled_date=(now - timedelta(days=6)).strftime("%Y-%m-%d"),
        completed_at=now - timedelta(days=6),
        status="Disputed",
        interaction_verification_status="Needs Review",
        created_at=now - timedelta(days=7)
    )

    db.add_all([j1, j2, j3, j4, j5, j6, j7])
    db.flush()

    # 5. Seed Evidence
    e1 = Evidence(
        evidence_id="EVD-4029",
        job_id=j1.id,
        worker_id=w1.id,
        type="completion_photo",
        title="Rewired Distribution Panel with Labelled Circuits",
        description="Visual photographic record of replaced isolator, clean zip-tied wiring harness, and verified neutral busbar.",
        file_reference="evidence/mcb_panel_completion_j10482.jpg",
        verification_status="Evidence Supported",
        created_at=now - timedelta(days=20)
    )
    e2 = Evidence(
        evidence_id="EVD-4030",
        job_id=j1.id,
        worker_id=w1.id,
        type="invoice_reference",
        title="Signed Service Slip & Part Replacement Receipt",
        description="Invoice slip #INV-8821 acknowledging 63A Schneider MCB component replacement.",
        file_reference="evidence/receipt_schneider_mcb_8821.pdf",
        verification_status="Evidence Supported",
        created_at=now - timedelta(days=20)
    )
    e3 = Evidence(
        evidence_id="EVD-4031",
        job_id=j2.id,
        worker_id=w1.id,
        type="completion_photo",
        title="Luminous Inverter Output Voltage Test",
        description="Multimeter readout photo showing steady 230V AC output under load test.",
        file_reference="evidence/inverter_voltage_test_j10483.jpg",
        verification_status="Evidence Supported",
        created_at=now - timedelta(days=10)
    )
    e4 = Evidence(
        evidence_id="EVD-4032",
        job_id=j4.id,
        worker_id=w2.id,
        type="completion_photo",
        title="CPVC Pipe Pressure Joint & Leak-Free Wall Patch",
        description="Post-repair joint picture under 4-bar water pump pressure with zero leakage.",
        file_reference="evidence/plumbing_pressure_test_j10485.jpg",
        verification_status="Evidence Supported",
        created_at=now - timedelta(days=15)
    )
    db.add_all([e1, e2, e3, e4])
    db.flush()

    # 6. Seed Feedback
    f1 = Feedback(
        feedback_id="FDB-9012",
        job_id=j1.id,
        worker_id=w1.id,
        customer_id=c1.id,
        quality=5,
        reliability=5,
        timeliness=5,
        professionalism=5,
        comment="Amit arrived exactly on time with all the proper diagnostic tools. Found the burnt isolator within 15 minutes and explained the issue transparently. Excellent workmanship.",
        status="Recorded",
        created_at=now - timedelta(days=19)
    )
    f2 = Feedback(
        feedback_id="FDB-9013",
        job_id=j2.id,
        worker_id=w1.id,
        customer_id=c2.id,
        quality=5,
        reliability=4,
        timeliness=5,
        professionalism=5,
        comment="Very tidy work installing the inverter cabling. Left the utility room spotless and thoroughly verified emergency load tripping.",
        status="Recorded",
        created_at=now - timedelta(days=9)
    )
    f3 = Feedback(
        feedback_id="FDB-9014",
        job_id=j4.id,
        worker_id=w2.id,
        customer_id=c3.id,
        quality=5,
        reliability=5,
        timeliness=4,
        professionalism=5,
        comment="Rajesh resolved our wall seepage without breaking unnecessary tiles. Very knowledgeable plumber.",
        status="Recorded",
        created_at=now - timedelta(days=14)
    )
    db.add_all([f1, f2, f3])
    db.flush()

    # 7. Seed Verifications
    v1 = Verification(
        verification_id="VRF-3011",
        job_id=j1.id,
        worker_id=w1.id,
        customer_id=c1.id,
        status="Evidence Supported",
        verification_method="Customer Digital Attestation & Technical Photo Review",
        verified_at=now - timedelta(days=19),
        notes="Customer Sunita Verma confirmed job execution and parts replaced. Photo evidence matches scope of work."
    )
    v2 = Verification(
        verification_id="VRF-3012",
        job_id=j2.id,
        worker_id=w1.id,
        customer_id=c2.id,
        status="Evidence Supported",
        verification_method="Customer Digital Confirmation",
        verified_at=now - timedelta(days=9),
        notes="Customer Ramesh Rao confirmed inverter installation."
    )
    v3 = Verification(
        verification_id="VRF-3013",
        job_id=j3.id,
        worker_id=w1.id,
        customer_id=c3.id,
        status="Pending",
        verification_method="Awaiting Customer Response",
        verified_at=None,
        notes="Digital confirmation link delivered to customer phone."
    )
    v4 = Verification(
        verification_id="VRF-3014",
        job_id=j7.id,
        worker_id=w5.id,
        customer_id=c1.id,
        status="Needs Review",
        verification_method="Flagged by Customer Dispute",
        verified_at=None,
        notes="Customer reported leak reappeared within 24 hours. Under review."
    )
    db.add_all([v1, v2, v3, v4])
    db.flush()

    # 8. Seed Reputation Events
    r1 = ReputationEvent(
        reputation_event_id="REP-7031",
        worker_id=w1.id,
        job_id=j1.id,
        event_type="Evidence Supported",
        summary="Customer confirmed completion of MCB distribution repair with 2 verified evidence documents.",
        impact="Positive",
        confidence="High",
        created_at=now - timedelta(days=19)
    )
    r2 = ReputationEvent(
        reputation_event_id="REP-7032",
        worker_id=w1.id,
        job_id=j1.id,
        event_type="Feedback Recorded",
        summary="5-star structured feedback recorded for electrical craftsmanship and punctuality.",
        impact="Positive",
        confidence="High",
        created_at=now - timedelta(days=19)
    )
    r3 = ReputationEvent(
        reputation_event_id="REP-7033",
        worker_id=w1.id,
        job_id=j2.id,
        event_type="Interaction Confirmed",
        summary="Customer confirmed emergency inverter integration at South City II.",
        impact="Positive",
        confidence="High",
        created_at=now - timedelta(days=9)
    )
    r4 = ReputationEvent(
        reputation_event_id="REP-7034",
        worker_id=w2.id,
        job_id=j4.id,
        event_type="Evidence Supported",
        summary="Pressure test CPVC leak repair verified with completion photos.",
        impact="Positive",
        confidence="High",
        created_at=now - timedelta(days=14)
    )
    r5 = ReputationEvent(
        reputation_event_id="REP-7035",
        worker_id=w5.id,
        job_id=j7.id,
        event_type="Dispute Raised",
        summary="Customer raised dispute on sink mixer installation due to persistent drip.",
        impact="Negative",
        confidence="Limited",
        created_at=now - timedelta(days=5)
    )
    db.add_all([r1, r2, r3, r4, r5])
    db.flush()

    # 9. Seed Disputes
    d1 = Dispute(
        dispute_id="DSP-5021",
        job_id=j7.id,
        worker_id=w5.id,
        customer_id=c1.id,
        raised_by="customer",
        reason="Leakage following tap replacement",
        description="The kitchen swivel faucet began leaking from under-counter flex hose connection 12 hours after service.",
        status="Open",
        resolution=None,
        resolved_at=None,
        created_at=now - timedelta(days=5)
    )
    db.add(d1)
    db.flush()

    # 10. Seed Blockchain Anchors via standard anchor_job_interaction
    ba1 = anchor_job_interaction(db, j1, r1)
    ba2 = anchor_job_interaction(db, j2, r3)
    db.flush()

    # 11. Seed Append-Only Activity Log (Chronological record)
    activities = [
        ActivityEvent(
            entity_type="worker",
            entity_id=w1.cred_id,
            event_type="Worker Registered",
            description="Amit Sharma registered profile with 7 years claimed experience in electrical wiring.",
            actor="Worker",
            created_at=now - timedelta(days=90)
        ),
        ActivityEvent(
            entity_type="job",
            entity_id=j1.job_id,
            event_type="Job Created",
            description="Service requested: Distribution Board & MCB Rewiring at DLF Phase 1.",
            actor="Customer",
            created_at=now - timedelta(days=21)
        ),
        ActivityEvent(
            entity_type="job",
            entity_id=j1.job_id,
            event_type="Customer Confirmed",
            description="Sunita Verma confirmed the service interaction occurred successfully.",
            actor="Customer",
            created_at=now - timedelta(days=20)
        ),
        ActivityEvent(
            entity_type="evidence",
            entity_id=e1.evidence_id,
            event_type="Evidence Attached",
            description="Completion photo of distribution board wiring attached to JOB-10482.",
            actor="Worker",
            created_at=now - timedelta(days=20)
        ),
        ActivityEvent(
            entity_type="feedback",
            entity_id=f1.feedback_id,
            event_type="Feedback Submitted",
            description="Customer submitted 5/5 structured review for quality and reliability.",
            actor="Customer",
            created_at=now - timedelta(days=19)
        ),
        ActivityEvent(
            entity_type="blockchain_anchor",
            entity_id=j1.job_id,
            event_type="Blockchain Anchored",
            description=f"Job {j1.job_id} canonical hash ({ba1.record_hash[:12]}...) anchored via the configured integrity service (Tx: {ba1.transaction_reference[:16]}...).",
            actor="System:BlockchainService",
            created_at=now - timedelta(days=19)
        ),
        ActivityEvent(
            entity_type="reputation",
            entity_id=r1.reputation_event_id,
            event_type="Reputation Recorded",
            description="Reputation event generated from verified interaction JOB-10482.",
            actor="System",
            created_at=now - timedelta(days=19)
        ),
        ActivityEvent(
            entity_type="job",
            entity_id=j2.job_id,
            event_type="Job Completed & Confirmed",
            description="Ramesh Rao confirmed completion of Inverter Backup System Integration.",
            actor="Customer",
            created_at=now - timedelta(days=9)
        ),
        ActivityEvent(
            entity_type="blockchain_anchor",
            entity_id=j2.job_id,
            event_type="Blockchain Anchored",
            description=f"Job {j2.job_id} canonical hash ({ba2.record_hash[:12]}...) anchored via the configured integrity service (Tx: {ba2.transaction_reference[:16]}...).",
            actor="System:BlockchainService",
            created_at=now - timedelta(days=9)
        ),
        ActivityEvent(
            entity_type="dispute",
            entity_id=d1.dispute_id,
            event_type="Dispute Raised",
            description="Dispute opened on JOB-10488: Leakage following tap replacement.",
            actor="Customer",
            created_at=now - timedelta(days=5)
        )
    ]
    db.add_all(activities)
    db.commit()
