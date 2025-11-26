# Quick Deployment Guide for Project Bayani Backend

## 📦 What You Need

1. Your trained `best.pt` YOLOv9 model
2. GitHub account (for deployment)
3. Choose a hosting platform

---

## 🚀 Option 1: Render (Easiest - Free Tier)

### Step 1: Prepare Repository

```bash
# Commit all changes
git add .
git commit -m "Prepare backend for deployment"
git push origin master
```

### Step 2: Upload Model

**After deployment, upload your `best.pt` model:**

1. Go to Render Dashboard → Your Service
2. Click "Shell" tab
3. Run:
```bash
cd /app/models
# Upload your best.pt here via SCP or the web interface
```

**OR** use environment variable to download from cloud:

```bash
# Add to Render Environment Variables:
MODEL_URL=https://your-cloud-storage.com/best.pt

# Update config.py to download model on startup
```

### Step 3: Deploy to Render

1. Go to https://render.com
2. Sign in with GitHub
3. Click "New" → "Web Service"
4. Connect `project-bayani` repository
5. Render will auto-detect `render.yaml`
6. Click "Create Web Service"

**Your API URL:** `https://bayani-backend.onrender.com`
**WebSocket URL:** `wss://bayani-backend.onrender.com/ws/predict`

---

## 🚂 Option 2: Railway (No Cold Starts)

### Step 1: Install Railway CLI

```powershell
npm install -g @railway/cli
```

### Step 2: Deploy

```bash
# Login
railway login

# Initialize
railway init

# Deploy
railway up

# Upload model
railway run bash
# Then upload best.pt to models/ folder
```

**Your API URL:** Provided after deployment

---

## ✈️ Option 3: Fly.io (Global Edge)

### Step 1: Install Fly CLI

```powershell
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

### Step 2: Deploy

```bash
# Login
flyctl auth login

# Launch app
flyctl launch --config fly.toml

# Deploy
flyctl deploy

# Upload model via SSH
flyctl ssh console
cd /app/models
# Upload best.pt
```

---

## 🎮 Option 4: GPU Hosting (For YOLOv9)

### RunPod (Recommended for GPU)

**If you need GPU for faster inference:**

1. Sign up at https://runpod.io
2. Deploy GPU Pod:
   - Template: PyTorch 2.0
   - GPU: RTX 3060 or better
   - Expose port 8000

3. SSH and setup:
```bash
git clone https://github.com/N3oDevs/project-bayani.git
cd project-bayani/backend

# Install with GPU support
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
pip install -r requirements.txt

# Copy your best.pt to models/
# Upload via SCP or Jupyter

# Start server
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

**Cost:** ~$10-15/mo for 24/7, or pay-per-hour

---

## 📤 Upload Your best.pt Model

### Method 1: Git LFS (For Small Models < 100MB)

```bash
# Install Git LFS
git lfs install

# Track .pt files
git lfs track "*.pt"

# Add your model
mkdir -p backend/models
cp /path/to/your/best.pt backend/models/
git add backend/models/best.pt
git commit -m "Add trained model"
git push
```

### Method 2: Cloud Storage (Recommended)

**Upload to Google Drive/Dropbox/OneDrive:**

1. Upload `best.pt` to cloud
2. Get direct download link
3. Add to backend `.env`:

```bash
MODEL_URL=https://your-direct-download-link/best.pt
```

4. Model will auto-download on startup

### Method 3: Direct Upload After Deployment

**After deploying backend:**

```bash
# Using SCP (if SSH available)
scp best.pt user@your-server:/app/models/

# Or use platform's file upload interface
```

---

## 🔧 Configure Environment Variables

### In your hosting platform, add:

```bash
# Model configuration
MODEL_PATH=models/best.pt
MODEL_URL=https://your-cloud-storage.com/best.pt  # Optional

# CORS (your frontend URL)
CORS_ORIGINS=http://localhost:3000,https://your-frontend.vercel.app

# Port (usually auto-set)
PORT=8000
```

---

## ✅ Test Your Deployment

### 1. Check Health Endpoint

```bash
curl https://your-backend-url.com/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "service": "Project Bayani Backend",
  "model": {
    "loaded": true,
    "device": "cpu",
    "classes": {...}
  }
}
```

### 2. Check Model Info

```bash
curl https://your-backend-url.com/model/info
```

### 3. Test WebSocket

Open browser console on `http://localhost:3000`:

```javascript
const ws = new WebSocket('wss://your-backend-url.com/ws/predict');
ws.onopen = () => console.log('Connected!');
ws.onmessage = (e) => console.log('Received:', e.data);
```

---

## 🔄 Update Frontend

### Update `frontend/.env.local`:

```bash
# Production backend
NEXT_PUBLIC_API_BASE_URL=https://bayani-backend.onrender.com
NEXT_PUBLIC_WS_URL=wss://bayani-backend.onrender.com/ws/predict
NEXT_PUBLIC_AUDIO_WS_URL=wss://bayani-backend.onrender.com/ws/audio
NEXT_PUBLIC_GPS_WS_URL=wss://bayani-backend.onrender.com/ws/gps

# Keep Supabase as is
NEXT_PUBLIC_SUPABASE_URL=https://qqxvprrqeybjjcwoexvv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📊 Cost Breakdown

| Platform | Free Tier | Paid | GPU Support |
|----------|-----------|------|-------------|
| Render | ✅ (sleeps) | $7/mo | ❌ |
| Railway | ✅ $5 credits | $5/mo | ❌ |
| Fly.io | ✅ | $5/mo | ❌ |
| RunPod | ❌ | $10-15/mo | ✅ |
| Vast.ai | ❌ | $3-10/mo | ✅ |

---

## 🎯 Recommended Setup

### For CPU-only (Development):
```
Frontend (Vercel) → FREE
Backend (Render) → FREE (with sleep)
Database (Supabase) → FREE
Total: FREE
```

### For GPU (Production):
```
Frontend (Vercel) → FREE
Backend GPU (RunPod) → $10-15/mo
Database (Supabase) → FREE
Total: $10-15/mo
```

---

## 🚨 Important Notes

1. **Model Size:** If `best.pt` > 100MB, use cloud storage instead of Git
2. **GPU Required:** For real-time camera detection (>15 FPS), use GPU hosting
3. **Free Tier Limits:** Render free tier sleeps after 15min inactivity
4. **Model Upload:** You'll need to upload `best.pt` after deployment

---

## 🔍 Troubleshooting

### "Model not loaded"
- Check if `best.pt` is in `models/` folder
- Verify file path in environment variables
- Check server logs for errors

### "Import torch could not be resolved"
- Normal during local development
- Will be installed on server during deployment

### WebSocket connection failed
- Check if backend URL uses `wss://` (not `ws://`)
- Verify CORS settings allow your frontend domain
- Check firewall/port settings

---

## 📞 Next Steps

1. **Choose hosting platform** (Render recommended for start)
2. **Push code to GitHub**
3. **Deploy backend**
4. **Upload your `best.pt` model**
5. **Update frontend environment variables**
6. **Deploy frontend to Vercel**
7. **Test end-to-end**

**Ready to deploy! Which platform do you want to start with?** 🚀
