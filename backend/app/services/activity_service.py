from datetime import datetime, timezone
from sqlalchemy.orm import Session
from ..models import ActivityEvent

def log_activity(
    db: Session,
    entity_type: str,
    entity_id: str,
    event_type: str,
    description: str,
    actor: str = "System"
) -> ActivityEvent:
    """
    Append-only activity logging.
    Never overwrites old activity entries. Corrections or state changes
    create new events for auditability.
    """
    activity = ActivityEvent(
        entity_type=entity_type,
        entity_id=str(entity_id),
        event_type=event_type,
        description=description,
        actor=actor,
        created_at=datetime.now(timezone.utc)
    )
    db.add(activity)
    db.flush()
    return activity
