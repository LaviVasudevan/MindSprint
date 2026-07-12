import uuid
import time
import json
import os
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
import redis
from app.question import generate_question
from app.db.session import get_db
from app.db.models import Game
import httpx

router = APIRouter()

GAME_DURATION = 60
rd = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))

ANALYTICS_URL = os.getenv("ANALYTICS_URL", "http://localhost:8001")


def send_event(payload: dict):
    try:
        httpx.post(
            f"{ANALYTICS_URL}/analytics/events",
            json=payload,
            timeout=0.5)
    except Exception:
        pass


class StartRequest(BaseModel):
    difficulty: str


class AnswerRequest(BaseModel):
    session_id: str
    answer: int


@router.post("/start")
def start_game(body: StartRequest):
    session_id = str(uuid.uuid4())
    first_question = generate_question(body.difficulty)
    session_data = {
        "difficulty": body.difficulty,
        "start_time": time.time(),
        "score": 0,
        "streak": 0,
        "total": 0,
        "correct": 0,
        "current_answer": first_question["answer"]
    }
    rd.setex(
        f"session:{session_id}",
        GAME_DURATION + 10,
        json.dumps(session_data))
    return {"session_id": session_id,
            "question": first_question["question"], "duration": GAME_DURATION}


@router.get("/question")
def get_question(session_id: str):
    raw = rd.get(f"session:{session_id}")
    if not raw:
        raise HTTPException(status_code=404, detail="Session not found")
    session = json.loads(raw)
    elapsed = time.time() - session["start_time"]
    if elapsed >= GAME_DURATION:
        raise HTTPException(status_code=400, detail="Game over")
    q = generate_question(session["difficulty"])
    session["current_answer"] = q["answer"]
    rd.setex(f"session:{session_id}", GAME_DURATION + 10, json.dumps(session))
    return {"question": q["question"],
            "time_remaining": round(GAME_DURATION - elapsed)}


@router.post("/answer")
def submit_answer(body: AnswerRequest):
    raw = rd.get(f"session:{body.session_id}")
    if not raw:
        raise HTTPException(status_code=404, detail="Session not found")
    session = json.loads(raw)
    elapsed = time.time() - session["start_time"]
    if elapsed >= GAME_DURATION:
        raise HTTPException(status_code=400, detail="Game over")
    session["total"] += 1
    correct = body.answer == session["current_answer"]
    if correct:
        session["correct"] += 1
        session["streak"] += 1
        session["score"] += 10 + (5 * (session["streak"] - 1))
    else:
        session["streak"] = 0
        session["score"] = max(0, session["score"] - 2)
    q = generate_question(session["difficulty"])
    session["current_answer"] = q["answer"]
    rd.setex(
        f"session:{
            body.session_id}",
        GAME_DURATION + 10,
        json.dumps(session))
    send_event({
        "event_type": "answer_submitted",
        "question": body.answer,
        "correct": correct
    })
    return {"correct": correct, "score": session["score"], "streak": session["streak"],
            "next_question": q["question"], "time_remaining": round(GAME_DURATION - elapsed)}


@router.post("/end")
def end_game(session_id: str, db: Session = Depends(get_db)):
    raw = rd.get(f"session:{session_id}")
    if not raw:
        raise HTTPException(status_code=404, detail="Session not found")
    session = json.loads(raw)
    rd.delete(f"session:{session_id}")
    accuracy = session["correct"] / \
        session["total"] if session["total"] > 0 else 0

    game = Game(
        difficulty=session["difficulty"],
        score=session["score"],
        accuracy=round(accuracy, 4),
        duration_seconds=60,
    )
    db.add(game)
    db.commit()

    send_event({
        "event_type": "game_ended",
        "difficulty": session["difficulty"],
        "score": session["score"],
        "accuracy": round(accuracy, 4)
    })

    rd.zadd("leaderboard", {session_id: session["score"]})

    return {"score": session["score"], "accuracy": round(accuracy * 100, 1),
            "correct": session["correct"], "total": session["total"]}


@router.get("/leaderboard")
def get_leaderboard():
    entries = rd.zrevrange("leaderboard", 0, 9, withscores=True)
    return [{"session_id": e[0].decode(), "score": int(e[1])} for e in entries]
