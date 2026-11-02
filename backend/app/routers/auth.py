from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from ..database import get_db
from ..models import UserAccount, Worker, Customer, ActivityEvent
from ..schemas import LoginRequest, TokenResponse
from ..services.auth_service import verify_password, create_access_token, require_auth

router = APIRouter(prefix="/auth", tags=["Authentication & Access Control"])

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticates user, verifies bcrypt hash, and issues secure JWT token.
    """
    user = db.query(UserAccount).filter(UserAccount.username == payload.username.lower().strip()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        # Log failed attempt
        audit = ActivityEvent(
            entity_type="security",
            entity_id=payload.username,
            event_type="Authentication Failed",
            description=f"Failed login attempt for username '{payload.username}'.",
            actor="SecurityGateway",
            created_at=datetime.now(timezone.utc)
        )
        db.add(audit)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password"
        )
        
    display_name = user.username.capitalize()
    if user.linked_worker_id and user.linked_worker_id:
        w = db.query(Worker).filter(Worker.id == user.linked_worker_id).first()
        if w:
            display_name = w.name
    elif user.linked_customer_id:
        c = db.query(Customer).filter(Customer.id == user.linked_customer_id).first()
        if c:
            display_name = c.name

    token = create_access_token({
        "sub": user.username,
        "role": user.role,
        "worker_id": user.linked_worker_id,
        "customer_id": user.linked_customer_id,
        "name": display_name
    })

    # Log successful login
    audit = ActivityEvent(
        entity_type="security",
        entity_id=user.username,
        event_type="User Login",
        description=f"User '{user.username}' logged in with role '{user.role}'.",
        actor=user.username,
        created_at=datetime.now(timezone.utc)
    )
    db.add(audit)
    db.commit()

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username,
        "display_name": display_name
    }

@router.get("/me")
def get_current_user_profile(user: dict = Depends(require_auth)):
    return user

@router.post("/logout")
def logout(user: dict = Depends(require_auth), db: Session = Depends(get_db)):
    audit = ActivityEvent(
        entity_type="security",
        entity_id=user.get("sub", "unknown"),
        event_type="User Logout",
        description=f"User '{user.get('sub')}' logged out.",
        actor=user.get("sub", "System"),
        created_at=datetime.now(timezone.utc)
    )
    db.add(audit)
    db.commit()
    return {"status": "success", "message": "Logged out successfully"}
