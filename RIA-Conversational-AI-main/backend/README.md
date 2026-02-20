# RIA Conversational AI – Backend API

A lightweight FastAPI backend that exposes REST endpoints and a WebRTC audio stream for RIA (your conversational intelligence layer).
Handles text input, micro-agent prompts, summaries, and real-time audio processing through fastrtc.

🔧 Tech Stack

## Core

    Python 3.10+

    FastAPI — HTTP API layer

    fastrtc — Real-time WebRTC audio transport

    OpenAI / LLM provider — for transcription, refinement, or micro-agent logic

### 🛠 Running the Project

# Install dependencies

pip install -r requirements.txt


# Start the server

uvicorn main:app --reload --host 0.0.0.0 --port 8000


# API Docs

http://localhost:8000/docs


# Health Check

GET /health


# WebRTC Endpoint

/webrtc