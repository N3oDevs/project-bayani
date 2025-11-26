# Architecture

Frontend: Next.js (App Router) in `frontend/`.

Backend: FastAPI in `backend/` with `/predict` for image inference.

                 ┌────────────────────────┐
                 │        Hardware        │
                 │ (Camera, GPS, Mic)     │
                 └───────────┬────────────┘
                             │
        ┌────────────────────┴─────────────────────────┐
        │                                              │
        ▼                                              ▼
┌────────────────────┐                      ┌───────────────────┐
│ Real-Time Video    │                      │ GPS Coordinates   │
│ Frames             │                      │ (lat, long)       │
│ (WebSocket/WebRTC) │                      │ Small JSON data   │
└─────────┬──────────┘                      └─────────┬─────────┘
          │                                           │
          ▼                                           ▼
┌──────────────────────────┐                ┌─────────────────────────┐
│ Frontend / Web (React)   │                │ Frontend / Web (React)  │
│ - Display live video     │                │ - Show GPS map/location │
│ - Overlay YOLOv9 results │                │ - Optional: send GPS    │
│ - Click-to-record voice  │                │   to Supabase later     │
└─────────┬────────────────┘                └─────────────────────────┘
          │                                             
          │ Video frames / detection request            
          ▼                                             
┌──────────────────────────┐
│ Backend API / FastAPI    │
│ - Receives video frames  │
│ - Runs YOLOv9 on GPU     │
│ - Returns detection JSON │
└─────────┬────────────────┘
          │
          ▼
┌──────────────────────────┐
│ Frontend / Web (React)   │
│ - Overlay bounding boxes │
│ - Show labels/confidence │
│ - Display voice & GPS    │
└─────────┬────────────────┘
          │
          │ Voice recording (click) & GPS logs
          ▼
┌─────────────────────────────┐
│ Supabase                    │
│ - Store voice recordings    │
│ - Store GPS logs            │
└─────────────────────────────┘

