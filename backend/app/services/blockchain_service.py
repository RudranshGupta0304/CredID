"""CredID integrity anchoring.

The application stores the full record in SQLite and anchors only a SHA-256
fingerprint. A real EVM testnet can be enabled with BLOCKCHAIN_RPC_URL,
BLOCKCHAIN_PRIVATE_KEY and BLOCKCHAIN_ANCHOR_ADDRESS. Without those secrets,
the prototype uses a clearly labelled local integrity anchor and never pretends
that a fake transaction hash is a blockchain transaction.
"""
import os
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from .hashing_service import compute_record_hash
from ..models import BlockchainAnchor, Job, ReputationEvent, ActivityEvent

BLOCKCHAIN_NETWORK = os.getenv("BLOCKCHAIN_NETWORK", "Local Integrity Anchor")
RPC_URL = os.getenv("BLOCKCHAIN_RPC_URL")
PRIVATE_KEY = os.getenv("BLOCKCHAIN_PRIVATE_KEY")
ANCHOR_ADDRESS = os.getenv("BLOCKCHAIN_ANCHOR_ADDRESS")


def _canonical_job(job: Job) -> dict:
    return {
        "record_type": "job_interaction",
        "job_id": job.job_id,
        "worker_cred_id": job.worker.cred_id if job.worker else "",
        "service_type": job.service_type,
        "location_district": job.location.split(",")[-1].strip() if "," in job.location else job.location,
        "amount": round(float(job.amount), 2),
        "status": job.status,
        "interaction_verification_status": job.interaction_verification_status,
        "completed_at": job.completed_at.isoformat() if job.completed_at else None,
        "evidence_count": len(job.evidence_items),
        "feedback_count": len(job.feedbacks),
    }


def _try_real_evm_anchor(record_hash: str) -> tuple[str, str, int | None]:
    """Send the hash as transaction data when a real EVM wallet is configured."""
    if not (RPC_URL and PRIVATE_KEY and ANCHOR_ADDRESS):
        return "", "Local Integrity Anchor", None
    try:
        from web3 import Web3
        from eth_account import Account
        w3 = Web3(Web3.HTTPProvider(RPC_URL, request_kwargs={"timeout": 10}))
        if not w3.is_connected():
            raise RuntimeError("Configured blockchain RPC is unreachable")
        account = Account.from_key(PRIVATE_KEY)
        nonce = w3.eth.get_transaction_count(account.address)
        chain_id = w3.eth.chain_id
        tx = {
            "to": Web3.to_checksum_address(ANCHOR_ADDRESS),
            "value": 0,
            "data": Web3.to_bytes(hexstr="0x" + record_hash),
            "nonce": nonce,
            "chainId": chain_id,
            "gas": 100000,
            "maxFeePerGas": w3.to_wei("30", "gwei"),
            "maxPriorityFeePerGas": w3.to_wei("1", "gwei"),
        }
        signed = account.sign_transaction(tx)
        tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction).hex()
        return tx_hash, f"EVM chain {chain_id}", None
    except Exception as exc:
        raise RuntimeError(f"Real blockchain anchoring failed: {exc}") from exc


def anchor_job_interaction(db: Session, job: Job, rep_event: Optional[ReputationEvent] = None) -> BlockchainAnchor:
    record_hash = compute_record_hash(_canonical_job(job))

    # Avoid duplicate anchors for the same exact state.
    existing = db.query(BlockchainAnchor).filter(
        BlockchainAnchor.record_type == "job_interaction",
        BlockchainAnchor.record_id == job.job_id,
        BlockchainAnchor.record_hash == record_hash,
    ).first()
    if existing:
        return existing

    tx_ref, network, block_number = _try_real_evm_anchor(record_hash)
    if not tx_ref:
        # Local anchor is deliberately NOT presented as a real blockchain tx.
        seq = db.query(BlockchainAnchor).count() + 1
        tx_ref = f"local-{record_hash[:24]}-{seq:04d}"
        network = "Local Integrity Anchor"

    now = datetime.now(timezone.utc)
    anchor = BlockchainAnchor(
        record_type="job_interaction",
        record_id=job.job_id,
        record_hash=record_hash,
        blockchain_network=network,
        transaction_reference=tx_ref,
        block_number=block_number,
        anchored_at=now,
        verification_status="Anchored",
        reputation_event_id=rep_event.id if rep_event else None,
        job_id=job.id,
        worker_id=job.worker_id,
        created_at=now,
        updated_at=now,
    )
    db.add(anchor)
    db.flush()
    db.add(ActivityEvent(
        entity_type="blockchain_anchor", entity_id=job.job_id,
        event_type="Integrity Anchored",
        description=f"Canonical SHA-256 fingerprint for {job.job_id} anchored via {network}.",
        actor="System:IntegrityService", created_at=now,
    ))
    db.flush()
    return anchor


def verify_job_integrity(db: Session, job: Job) -> Dict[str, Any]:
    anchor = db.query(BlockchainAnchor).filter(
        BlockchainAnchor.record_type == "job_interaction",
        BlockchainAnchor.record_id == job.job_id,
    ).order_by(BlockchainAnchor.id.desc()).first()
    if not anchor:
        return {"is_anchored": False, "status": "Not Anchored", "matches": False,
                "tamper_detected": False, "explanation": "No integrity anchor exists for this job yet."}

    current_hash = compute_record_hash(_canonical_job(job))
    is_match = current_hash == anchor.record_hash
    status = "Integrity Verified" if is_match else "Integrity Mismatch"
    anchor.verification_status = "Verified" if is_match else "Integrity Mismatch"
    db.add(ActivityEvent(
        entity_type="security", entity_id=job.job_id,
        event_type="Integrity Check" if is_match else "Integrity Mismatch Detected",
        description=f"Integrity check for {job.job_id}: {'record matches anchor' if is_match else 'record differs from anchored fingerprint'}.",
        actor="System:SecurityAuditor", created_at=datetime.now(timezone.utc),
    ))
    db.flush()
    return {
        "is_anchored": True, "status": status, "anchored_hash": anchor.record_hash,
        "current_hash": current_hash, "matches": is_match,
        "blockchain_network": anchor.blockchain_network,
        "transaction_reference": anchor.transaction_reference,
        "block_number": anchor.block_number,
        "anchored_at": anchor.anchored_at.isoformat() if anchor.anchored_at else None,
        "tamper_detected": not is_match,
        "explanation": "The current canonical record matches the anchored fingerprint." if is_match
            else "Integrity mismatch: the current record differs from the anchored fingerprint and needs review.",
    }
