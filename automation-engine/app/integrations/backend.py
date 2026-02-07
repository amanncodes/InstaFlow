import requests
import uuid
from datetime import datetime

BACKEND_URL = "http://127.0.0.1:3000/api/events"

def emit_event(account_id: str, event_type: str, payload: dict):
    data = {
        "event_id": f"evt_{uuid.uuid4()}",
        "account_id": account_id,
        "event_type": event_type,
        "severity": "info",
        "source": "automation_worker",
        "occurred_at": datetime.utcnow().isoformat() + "Z",
        "payload": payload
    }

    try:
        requests.post(BACKEND_URL, json=data, timeout=5)
    except Exception as e:
        print(f"Failed to emit event: {e}")
