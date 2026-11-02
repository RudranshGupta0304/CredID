import hashlib
import json
from typing import Dict, Any, List

def canonicalize_record(data: Dict[str, Any]) -> str:
    """
    Produces a deterministic JSON canonical representation.
    Keys are sorted, whitespace is normalized, and datetimes/floats are formatted.
    Ensures that identical records always generate the identical SHA-256 hash.
    """
    def sanitize(obj):
        if isinstance(obj, dict):
            return {k: sanitize(v) for k, v in sorted(obj.items())}
        elif isinstance(obj, list):
            return [sanitize(item) for item in obj]
        elif hasattr(obj, "isoformat"):
            return obj.isoformat()
        elif isinstance(obj, float):
            return round(obj, 4)
        return str(obj) if obj is not None else ""

    canonical_dict = sanitize(data)
    return json.dumps(canonical_dict, sort_keys=True, separators=(',', ':'))

def compute_record_hash(data: Dict[str, Any]) -> str:
    """
    Generates a secure SHA-256 digest of the canonicalized record.
    """
    canonical_str = canonicalize_record(data)
    return hashlib.sha256(canonical_str.encode("utf-8")).hexdigest()

def compute_merkle_root(hashes: List[str]) -> str:
    """
    Computes a cryptographic Merkle root from a list of record hashes.
    Useful for batch anchoring multiple reputation events into a single block/anchor.
    """
    if not hashes:
        return hashlib.sha256(b"empty_credid_tree").hexdigest()
    
    current = hashes[:]
    while len(current) > 1:
        if len(current) % 2 != 0:
            current.append(current[-1]) # Duplicate last hash if odd
        next_level = []
        for i in range(0, len(current), 2):
            combined = current[i] + current[i+1]
            next_level.append(hashlib.sha256(combined.encode("utf-8")).hexdigest())
        current = next_level
    return current[0]
