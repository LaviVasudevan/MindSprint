from fastapi import APIRouter
import json
import os
import redis
from collections import defaultdict

router = APIRouter()
rd = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))

@router.get("/stats/difficulty")
def stats_by_difficulty():
    raw_events = rd.lrange("events", 0, -1)
    totals = defaultdict(lambda: {"count": 0, "score_sum": 0})
    for raw in raw_events:
        e = json.loads(raw)
        if e["event_type"] == "game_ended" and e.get("difficulty") and e.get("score") is not None:
            d = e["difficulty"]
            totals[d]["count"] += 1
            totals[d]["score_sum"] += e["score"]
    return {
        d: {
            "games": v["count"],
            "avg_score": round(v["score_sum"] / v["count"], 1) if v["count"] else 0
        }
        for d, v in totals.items()
    }

@router.get("/stats/questions")
def most_missed_questions():
    raw_events = rd.lrange("events", 0, -1)
    misses = defaultdict(int)
    for raw in raw_events:
        e = json.loads(raw)
        if e["event_type"] == "answer_submitted" and e.get("correct") is False and e.get("question"):
            misses[e["question"]] += 1
    sorted_misses = sorted(misses.items(), key=lambda x: x[1], reverse=True)
    return [{"question": q, "misses": count} for q, count in sorted_misses[:10]]