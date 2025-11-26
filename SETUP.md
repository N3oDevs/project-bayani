# Project Bayani - Setup Guide

## Prerequisites

- **Node.js** >= 20.0.0 (LTS)
- **Python** 3.11 or 3.12
- **Git**
- **Camera** (for live video detection)

## Project Structure

```
project-bayani/
├── frontend/          # Next.js React application
├── backend/           # FastAPI Python server
├── docs/              # Documentation
└── SETUP.md          # This file
```

---

## 🚀 Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/N3oDevs/project-bayani.git
cd project-bayani
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# Windows (PowerShell)
.\venv\Scripts\Activate.ps1
# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
copy .env.example .env
# Edit .env and set MODEL_PATH if needed

# Place your YOLO ONNX model
# Create folder: backend/app/models/
# Add file: backend/app/models/yolo.onnx

# Run backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will run at: `http://localhost:8000`

### 3. Frontend Setup

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
copy .env.example .env.local
# Edit .env.local with your backend URL and Supabase credentials

# Run development server
npm run dev
```

Frontend will run at: `http://localhost:3000`

---

## 📋 Environment Variables

### Frontend (`frontend/.env.local`)

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_BASE_URL` | Backend API URL | `http://localhost:8000` |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL for real-time detection | `ws://localhost:8000/ws/predict` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | - |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | - |

### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `MODEL_PATH` | Path to YOLO ONNX model | `./app/models/yolo.onnx` |
| `HOST` | Server host | `0.0.0.0` |
| `PORT` | Server port | `8000` |
| `CORS_ORIGINS` | Allowed CORS origins | `http://localhost:3000` |

---

## 🤖 Getting YOLO Model

You need a YOLOv9 ONNX model file:

1. **Download pre-trained model** from [YOLOv9 repository](https://github.com/WongKinYiu/yolov9)
2. **Convert to ONNX** format if needed
3. **Place in**: `backend/app/models/yolo.onnx`
4. **Update** `MODEL_PATH` in `backend/.env`

---

## 🗄️ Supabase Setup (Optional)

For voice recordings and GPS logging:

1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Get Project URL and Anon Key from Settings > API
4. Update `frontend/.env.local` with credentials
5. Create tables (see database schema below)

### Database Schema

```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Voice recordings table
CREATE TABLE voice_recordings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  file_url TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- GPS logs table
CREATE TABLE gps_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  latitude FLOAT,
  longitude FLOAT,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

---

## 🧪 Testing

### Test Backend API

```bash
# Health check
curl http://localhost:8000

# Upload image for detection
curl -X POST http://localhost:8000/predict \
  -F "file=@test_image.jpg"
```

### Test Frontend

1. Open browser to `http://localhost:3000`
2. Allow camera access
3. Click "Play" button to start real-time detection
4. View detection overlays on video feed

---

## 🐳 Docker Deployment

### Backend Docker

```bash
cd backend
docker build -t project-bayani-backend .
docker run -p 8000:8000 -e MODEL_PATH=/app/models/yolo.onnx project-bayani-backend
```

### Frontend Docker

```bash
cd frontend
docker build -t project-bayani-frontend .
docker run -p 3000:3000 project-bayani-frontend
```

---

## 📦 Dependencies

### Frontend

- Next.js 15.5.6
- React 19.1.0
- Tailwind CSS 4
- Leaflet (maps)
- Framer Motion (animations)

### Backend

- FastAPI
- Uvicorn (ASGI server)
- ONNX Runtime (model inference)
- Pillow (image processing)
- NumPy (array operations)

---

## 🛠️ Troubleshooting

### Camera Access Denied

- Check browser permissions
- Use HTTPS in production (required for camera access)

### Backend Connection Failed

- Verify backend is running on port 8000
- Check CORS settings in `backend/.env`
- Update `NEXT_PUBLIC_API_BASE_URL` in frontend

### Model Loading Error

- Ensure `yolo.onnx` exists in `backend/app/models/`
- Verify `MODEL_PATH` in `backend/.env`
- Check model file isn't corrupted

### WebSocket Connection Issues

- Verify WebSocket URL format (`ws://` or `wss://`)
- Check firewall settings
- Ensure uvicorn started with `--reload` flag

---

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [YOLOv9 GitHub](https://github.com/WongKinYiu/yolov9)
- [Supabase Documentation](https://supabase.com/docs)

---

## 📄 License

See LICENSE file for details.

## 👥 Contributors

- N3oDevs Organization
