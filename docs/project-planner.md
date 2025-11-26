{
  "projectName": "Project Bayani",
  "description": "A real-time web application that streams video from hardware, performs YOLOv9 object detection on a GPU backend, tracks GPS locations, records voice, and stores data in Supabase.",
  "techStack": {
    "frontend": ["Next.js (App Router)", "React", "TypeScript", "Axios", "React-Mic", "React-Leaflet", "Leaflet"],
    "backend": ["FastAPI", "Python 3.12", "ONNX Runtime", "Uvicorn", "Pydantic", "python-multipart"],
    "development": ["VS Code", "Node.js LTS", "Git", "Vercel for frontend deployment", "Vast.ai / RunPod for GPU backend"]
  },
  "projectDetails": {
    "folderStructure": {
      "root": {
        "frontend": {
          "app": ["page.tsx", "components/", "hooks/", "styles/"],
          "public/": [],
          "package.json": "",
          "next.config.js": ""
        },
        "backend": {
          "main.py": "",
          "yolo/": ["model.onnx", "inference.py"],
          "requirements.txt": ""
        }
      }
    },
    "deploymentGoal": "Frontend deployed on Vercel, GPU backend on Vast.ai / RunPod, database on Supabase."
  },
  "coreFeatures": [
    "Real-time video streaming from hardware to frontend",
    "YOLOv9 object detection on GPU backend",
    "Overlay detection results (bounding boxes, labels, confidence) on frontend",
    "GPS location tracking displayed on map",
    "Voice recording via frontend and storage in Supabase",
    "Supabase storage for GPS logs and voice recordings",
    "Frontend-backend communication via REST API or WebSockets for real-time updates"
  ],
  "database": {
    "provider": "Supabase (PostgreSQL)",
    "orm": "Prisma",
    "schema": {
      "User": {
        "id": "Int @id @default(autoincrement())",
        "name": "String",
        "email": "String @unique",
        "createdAt": "DateTime @default(now())"
      },
      "VoiceRecording": {
        "id": "Int @id @default(autoincrement())",
        "userId": "Int",
        "fileUrl": "String",
        "timestamp": "DateTime @default(now())"
      },
      "GPSLog": {
        "id": "Int @id @default(autoincrement())",
        "userId": "Int",
        "latitude": "Float",
        "longitude": "Float",
        "timestamp": "DateTime @default(now())"
      }
    }
  },
  "pagesAndComponents": [
    "Home Page - Overview and live video feed",
    "VideoComponent - Handles WebRTC/WebSocket stream and canvas overlay",
    "GPSMap - Displays user's real-time GPS coordinates on Leaflet map",
    "VoiceRecorder - Allows recording and uploading voice to Supabase",
    "DetectionOverlay - Draw bounding boxes, labels, and confidence on video feed"
  ],
  "requirements": {
    "guide": "Beginner-friendly, step-by-step with exact terminal commands and code snippets.",
    "versions": {
      "Node.js": "LTS (>=20.0.0)",
      "Next.js": "Latest stable",
      "React": "Latest stable",
      "Python": "3.12",
      "FastAPI": "Latest stable",
      "Prisma": "Latest stable",
      "ONNX Runtime": "Latest stable"
    }
  },
  "deliverables": [
    "Frontend running on Vercel with live video, detection overlays, GPS map, and voice recording",
    "Backend running on Vast.ai / RunPod with YOLOv9 inference",
    "Database on Supabase with tables for users, GPS logs, and voice recordings",
    "API endpoints documented for frontend integration",
    "Full folder structure with setup instructions",
    "Production-ready deployment instructions"
  ]
}
