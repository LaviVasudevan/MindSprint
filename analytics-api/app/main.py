from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import events, stats

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(events.router, prefix="/analytics")
app.include_router(stats.router, prefix="/analytics")