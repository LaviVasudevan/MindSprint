from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import json
import os
import redis

router = APIRouter()
rd = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))

class Event(BaseModel):
    event_type: str
    difficulty: Optional[str] = None
    score: Optional[int] = None
    accuracy: Optional[float] = None
    question: Optional[str] = None
    correct: Optional[bool] = None

@router.post("/events")
def ingest_event(event: Event):
    rd.rpush("events", json.dumps(event.model_dump()))
    return {"status": "ok"}