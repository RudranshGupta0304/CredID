import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .database import engine, Base, SessionLocal
from .seed import seed_database
from .routers import (
    workers, customers, jobs, evidence, feedback,
    verifications, reputation, disputes, activity,
    credid, analytics, dev, blockchain, auth
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure all tables created
    Base.metadata.create_all(bind=engine)
    # Seed if database is empty
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title="CredID Full-Stack REST API & Blockchain Integrity Layer",
    description="Backend service for verified work interactions, evidence, structured feedback, and tamper-evident blockchain anchors.",
    version="1.1.0",
    lifespan=lifespan
)

# CORS configuration
CORS_ORIGINS_ENV = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000")
origins = [origin.strip() for origin in CORS_ORIGINS_ENV.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Register routers under /api
app.include_router(auth.router, prefix="/api")
app.include_router(workers.router, prefix="/api")
app.include_router(customers.router, prefix="/api")
app.include_router(jobs.router, prefix="/api")
app.include_router(evidence.router, prefix="/api")
app.include_router(feedback.router, prefix="/api")
app.include_router(verifications.router, prefix="/api")
app.include_router(reputation.router, prefix="/api")
app.include_router(disputes.router, prefix="/api")
app.include_router(activity.router, prefix="/api")
app.include_router(credid.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(blockchain.router, prefix="/api")
app.include_router(dev.router, prefix="/api")

@app.get("/")
def root():
    return {
        "product": "CredID",
        "tagline": "Verified Work. Portable Credibility.",
        "status": "online",
        "integrity_network": os.getenv("BLOCKCHAIN_NETWORK", "Local Integrity Anchor"),
        "environment": "Prototype / Demo Mode",
        "docs_url": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "mode": "development_prototype",
        "features": {
            "blockchain_integrity": True,
            "multilingual_support": True,
            "theme_system": True,
            "role_based_security": True
        }
    }
