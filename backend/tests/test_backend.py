import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
from app.seed import seed_database
from app.models import Job, BlockchainAnchor
from app.services.blockchain_service import verify_job_integrity

client = TestClient(app)

def setup_module():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_database(db)
    db.close()

def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"
    assert res.json()["features"]["blockchain_integrity"] is True

def test_auth_login():
    login_payload = {
        "username": "admin",
        "password": "admin123"
    }
    res = client.post("/api/auth/login", json=login_payload)
    assert res.status_code == 200
    token_data = res.json()
    assert "access_token" in token_data
    assert token_data["role"] == "admin"

def test_role_authorization_enforced():
    # Attempting worker creation as a Customer should be rejected with 403 Forbidden
    worker_payload = {
        "name": "Unauthorized Worker",
        "role": "Electrician",
        "skills": "Wiring",
        "experience_years": 3,
        "location": "Delhi"
    }
    headers = {"X-CredID-Role": "customer"}
    res = client.post("/api/workers", json=worker_payload, headers=headers)
    assert res.status_code == 403

def test_blockchain_anchoring_and_verification():
    # 1. Check blockchain verification endpoint on anchored job JOB-10482
    res = client.get("/api/blockchain/verify/job/JOB-10482")
    assert res.status_code == 200
    data = res.json()
    assert data["is_anchored"] is True
    assert data["matches"] is True
    assert data["status"] == "Integrity Verified"

def test_tamper_detection_mismatch():
    # Simulate an unauthorized database modification on a protected job
    db = SessionLocal()
    job = db.query(Job).filter(Job.job_id == "JOB-10482").first()
    assert job is not None
    
    # Tamper with the job directly in the database
    original_service = job.service_type
    job.service_type = "Hacked Unauthorized Service Change"
    db.commit()
    db.close()

    # Re-verify through the blockchain integrity service
    res = client.get("/api/blockchain/verify/job/JOB-10482")
    assert res.status_code == 200
    integrity = res.json()
    assert integrity["is_anchored"] is True
    assert integrity["matches"] is False
    assert integrity["tamper_detected"] is True
    assert integrity["status"] == "Integrity Mismatch"

    # Restore the job for subsequent tests
    db = SessionLocal()
    job = db.query(Job).filter(Job.job_id == "JOB-10482").first()
    job.service_type = original_service
    db.commit()
    db.close()
