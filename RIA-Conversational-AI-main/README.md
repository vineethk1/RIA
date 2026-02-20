**RIA Conversational AI**

A full-stack conversational AI system with real-time voice chat.

**Features**

-> Real-time audio streaming via WebRTC
-> speech-to-text and NLP
-> Action-item extraction from conversations
-> text-to-speech

**Tech Stack**

Backend: Python 3.10+, FastAPI, OpenAI API, fastrtc, uvicorn
Frontend: React (CRA), WebRTC

**Quick Start**
**Backend**
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

** Add OPENAI_API_KEY to .env **
uvicorn main:app --host 0.0.0.0 --port 8000

**Frontend**
npm install
npm start

**Key Endpoints**

POST /api/v1/text – Process text input
POST /api/v1/audio – Process audio stream
WS /webrtc – Real-time audio channel
GET /health – Health check

**How It Works**

User speaks → WebRTC captures audio
Backend transcribes via OpenAI Whisper
Text is normalized and analyzed
Action items extracted with metadata
Response returned with TTS

