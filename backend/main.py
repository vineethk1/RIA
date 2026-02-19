from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.api import router
from controllers.webrtc_handler import MeetingStreamHandler
from fastrtc import Stream
from pydantic import BaseModel
from typing import Dict, List

app = FastAPI(
    title="RIA Conversational AI API",
    description="API for RIA conversational AI services",
    version="1.0.0",
)

# ----------------- CORS -----------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],            # tighten this in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- REST API -----------------

app.include_router(router)

# ----------------- WebRTC Stream -----------------

# Create a single shared INSTANCE
handler = MeetingStreamHandler(refine_with_llm=False)

stream = Stream(
    handler=handler,
    modality="audio",
    mode="send-receive",
    # concurrency_limit=16,  # enable if your fastrtc version supports it
)

stream.mount(app, path="/webrtc")

# ----------------- Health check -----------------

@app.get("/health")
def health():
    """Service liveness probe."""
    return {"status": "ok"}