# AI Interview Simulator

A multimodal mock interview system that records your webcam and audio, analyzes non-verbal behavior in real time, and delivers a timestamped feedback dashboard — so you can review exactly where you lost eye contact or said "um" for the fourth time.

Built as a hackathon project. Deployed via Docker on Render.

---

## What It Actually Does

**During the interview**
- Records webcam feed and audio simultaneously
- Runs facial landmark detection (OpenCV) to track eye contact in real time
- Captures audio in raw chunks and feeds them to a Whisper STT engine

**After the interview**
- Detects and counts filler words (um, uh, like, basically, you know)
- Syncs every filler word event to a precise video timestamp
- Clicking a filler word in the dashboard jumps the video to that exact moment

**The hard part**

Raw audio chunking without word loss was the core engineering problem. STT engines drop words at chunk boundaries if you split naively. Built a pipeline that handles boundary overlap so no speech is lost between chunks, then re-aligns the transcription timeline to the original video clock for accurate timestamp sync.

---

## Tech Stack

| Layer | Stack |
|---|---|
| Backend | Python, FastAPI |
| Video Analysis | OpenCV, facial landmark detection |
| Speech-to-Text | OpenAI Whisper |
| Frontend | React.js |
| Containerization | Docker, docker-compose |
| Deployment | Render (backend), Vercel (frontend) |

---

## Architecture

```
Frontend (React)
    ↓ webcam stream + audio
Backend (FastAPI)
    ├── Video pipeline  →  OpenCV  →  eye contact scoring per frame
    ├── Audio pipeline  →  chunked  →  Whisper STT  →  transcript + timestamps
    └── Sync layer  →  maps filler word timestamps to video timeline
    ↓
Feedback Dashboard
    → filler word list (clickable → seeks video to that moment)
    → eye contact score over session duration
```

---

## Why This Was Hard to Build

Most interview tools analyze video OR audio — not both in sync. The challenge here was:

**1. Audio chunk boundaries**
Whisper drops words at split points. Solved with overlap-aware chunking that re-aligns timestamps post-merge so no word is lost between chunks.

**2. Video-audio sync**
Webcam timestamps drift from audio timestamps at scale. Built explicit sync logic using a shared session clock to keep both streams aligned.

**3. Non-blocking pipelines**
Facial landmark scoring runs per frame without blocking the audio pipeline. Both run concurrently and feed into the same feedback layer.

---

## Project Structure

```
AI-interviewer/
├── backend/          # FastAPI app — video pipeline, audio pipeline, sync layer
├── frontend/         # React app — interview UI + feedback dashboard
├── docker-compose.yml
└── render.yaml       # Render deployment config
```

---

## Built By

**Manas Arora** — Backend & AI Engineer

[linkedin.com/in/themanasarora](https://linkedin.com/in/themanasarora) · [github.com/themanasarora](https://github.com/themanasarora)
