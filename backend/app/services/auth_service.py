import os
import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer

DEMO_MODE = os.getenv("DEMO_MODE", "true").lower() == "true"
SECRET_KEY = os.getenv("JWT_SECRET_KEY") or ("credid_demo_only_change_me" if DEMO_MODE else "")
if not SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY must be configured when DEMO_MODE=false")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 hours for prototype convenience

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user_payload(token: Optional[str] = Depends(oauth2_scheme)) -> Optional[Dict[str, Any]]:
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

def require_auth(
    token: Optional[str] = Depends(oauth2_scheme),
    x_role_override: Optional[str] = Header(None, alias="X-CredID-Role")
) -> Dict[str, Any]:
    if token:
        payload = get_current_user_payload(token)
        if payload:
            return payload
            
    if DEMO_MODE and x_role_override:
        role_clean = x_role_override.lower().strip()
        if role_clean in ["admin", "worker", "customer"]:
            return {
                "sub": f"demo_{role_clean}",
                "role": role_clean,
                "name": f"Demo {role_clean.capitalize()}"
            }

    if DEMO_MODE:
        return {"sub": "demo_admin", "role": "admin", "name": "Platform Administrator"}
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

def require_role(allowed_roles: list[str]):
    def role_checker(user: Dict[str, Any] = Depends(require_auth)):
        user_role = user.get("role", "").lower()
        if user_role not in [r.lower() for r in allowed_roles] and user_role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Requires one of roles: {', '.join(allowed_roles)} (current: {user_role})"
            )
        return user
    return role_checker
