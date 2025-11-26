# RunPod GPU Deployment Guide for Project Bayani

## 🎮 Quick GPU Deployment (RunPod - Recommended)

RunPod is the best option for GPU hosting with YOLOv9:
- **Cost:** ~$0.30/hour (~$10-15/month if running 24/7)
- **GPU:** RTX 3060/3090/4090, A40, etc.
- **Setup:** 10 minutes

---

## 🚀 Step-by-Step Deployment

### Step 1: Sign Up & Add Funds

1. Go to https://runpod.io
2. Sign up with email/GitHub
3. Add at least $10 credits (Pay as you go)

### Step 2: Deploy GPU Pod

1. Click **"Deploy"** → **"GPU Cloud"**
2. Select Template:
   - Choose: **"RunPod PyTorch 2.1"** or **"PyTorch"**
3. Select GPU:
   - **Budget:** RTX 3060 (12GB VRAM) - ~$0.29/hr
   - **Recommended:** RTX 3090 (24GB VRAM) - ~$0.34/hr
   - **Performance:** RTX 4090 (24GB VRAM) - ~$0.69/hr
4. Configure Pod:
   - Container Disk: **20 GB**
   - Volume Disk: Optional (for persistent model storage)
   - Expose HTTP Ports: **8000**
   - Expose TCP Ports: Leave empty
5. Click **"Deploy On-Demand"** (or use Spot for cheaper but can be interrupted)

### Step 3: Connect to Your Pod

Once deployed, you'll get:
- **SSH Access:** `ssh root@<pod-id>-ssh.runpod.io -p <port>`
- **Jupyter URL:** `https://<pod-id>-8888.proxy.runpod.net`
- **HTTP URL:** `https://<pod-id>-8000.proxy.runpod.net`

### Step 4: Setup Your Application

**Option A: SSH Setup**

```bash
# Connect via SSH
ssh root@<pod-id>-ssh.runpod.io -p <port>

# Clone your repository
git clone https://github.com/N3oDevs/project-bayani.git
cd project-bayani/backend

# Install dependencies with GPU support
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
pip install -r requirements.txt

# Verify GPU is detected
python -c "import torch; print(f'CUDA Available: {torch.cuda.is_available()}'); print(f'GPU: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else None}')"

# Create models directory
mkdir -p models
```

**Option B: Jupyter Setup**

1. Open Jupyter URL in browser
2. Create new terminal
3. Run the same commands as above

### Step 5: Upload Your best.pt Model

**Method 1: Direct Upload via Jupyter**
1. Open Jupyter interface
2. Navigate to `project-bayani/backend/models/`
3. Click **"Upload"** button
4. Select your `best.pt` file
5. Wait for upload to complete

**Method 2: SCP from Your PC**
```bash
# From your PC where best.pt is located
scp -P <port> best.pt root@<pod-id>-ssh.runpod.io:/workspace/project-bayani/backend/models/
```

**Method 3: Download from URL**
```bash
# If you uploaded to Google Drive/Dropbox
cd models
wget "YOUR_DIRECT_DOWNLOAD_URL" -O best.pt
```

### Step 6: Start the Backend

```bash
cd /workspace/project-bayani/backend

# Start with GPU
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Or use nohup for background running
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > server.log 2>&1 &
```

### Step 7: Get Your WebSocket URL

Your backend is now accessible at:
- **HTTP API:** `https://<pod-id>-8000.proxy.runpod.net`
- **WebSocket:** `wss://<pod-id>-8000.proxy.runpod.net/ws/predict`

Example:
```
https://abc123xyz-8000.proxy.runpod.net
wss://abc123xyz-8000.proxy.runpod.net/ws/predict
```

### Step 8: Update Frontend Environment

Update `frontend/.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=https://<pod-id>-8000.proxy.runpod.net
NEXT_PUBLIC_WS_URL=wss://<pod-id>-8000.proxy.runpod.net/ws/predict
NEXT_PUBLIC_AUDIO_WS_URL=wss://<pod-id>-8000.proxy.runpod.net/ws/audio
NEXT_PUBLIC_GPS_WS_URL=wss://<pod-id>-8000.proxy.runpod.net/ws/gps
```

---

## ✅ Verify GPU is Working

### Test GPU Detection

```bash
cd /workspace/project-bayani/backend

# Run Python test
python << EOF
import torch
from app.models.yolo_model import YOLOModel

print(f"PyTorch Version: {torch.__version__}")
print(f"CUDA Available: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"GPU: {torch.cuda.get_device_name(0)}")
    print(f"CUDA Version: {torch.version.cuda}")

# Test model loading
model = YOLOModel("models/best.pt")
print(f"\nModel Info: {model.get_model_info()}")
EOF
```

### Test Health Endpoint

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "Project Bayani Backend",
  "model": {
    "loaded": true,
    "device": "cuda",
    "classes": {...}
  }
}
```

---

## 💰 Cost Optimization

### 1. Use Spot Instances
- **60-70% cheaper** than on-demand
- Can be interrupted (get notification before termination)
- Good for development/testing

### 2. Stop Pod When Not Using
```bash
# Via RunPod Dashboard
# Click "Stop" on your pod
# Restart when needed (30-60s startup)
```

### 3. Auto-Stop Script
```bash
# Add to crontab to stop after 8 hours
0 */8 * * * curl -X POST "https://api.runpod.io/v1/pods/<pod-id>/stop" -H "Authorization: Bearer <api-key>"
```

### 4. Use Persistent Volume
- Store your model on persistent volume
- Faster startup (no need to re-upload model)
- Costs ~$0.10/GB/month

---

## 📊 GPU Recommendations by Model Size

| YOLOv9 Model | Min VRAM | Recommended GPU | Cost/Hour |
|--------------|----------|-----------------|-----------|
| YOLOv9-t/s | 4GB | RTX 3060 (12GB) | $0.29 |
| YOLOv9-m | 6GB | RTX 3060 (12GB) | $0.29 |
| YOLOv9-c | 8GB | RTX 3090 (24GB) | $0.34 |
| YOLOv9-e | 12GB | RTX 3090 (24GB) | $0.34 |

---

## 🔄 Alternative GPU Hosts

### Vast.ai (Cheapest)
- **Cost:** ~$0.10-0.30/hour
- **Setup:** Manual, marketplace
- **Pros:** Very cheap
- **Cons:** Quality varies
- **Link:** https://vast.ai

### Lambda Cloud
- **Cost:** ~$0.50-1.00/hour
- **Setup:** Simple
- **Pros:** ML-optimized
- **Cons:** Waitlist for GPUs
- **Link:** https://lambdalabs.com

### Paperspace Gradient
- **Cost:** ~$0.51/hour (RTX 4000)
- **Setup:** Easy
- **Pros:** Good UI, Jupyter included
- **Cons:** More expensive
- **Link:** https://www.paperspace.com

---

## 🛠️ Troubleshooting

### GPU Not Detected
```bash
# Check NVIDIA driver
nvidia-smi

# Reinstall PyTorch with CUDA
pip uninstall torch torchvision
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
```

### Model Not Loading
```bash
# Check file exists
ls -lh models/best.pt

# Check file permissions
chmod 644 models/best.pt

# Test loading
python -c "from ultralytics import YOLO; model = YOLO('models/best.pt'); print('Model loaded!')"
```

### WebSocket Connection Failed
```bash
# Check if server is running
ps aux | grep uvicorn

# Check port is exposed
netstat -tulpn | grep 8000

# Test locally first
curl http://localhost:8000/health
```

### Out of Memory
```bash
# Reduce batch size in model
# Or use smaller GPU model (YOLOv9-s instead of YOLOv9-c)
# Or get larger GPU (RTX 3090 24GB)
```

---

## 📝 Startup Script

Create `backend/start.sh` for easy restarts:

```bash
#!/bin/bash

# Navigate to project
cd /workspace/project-bayani/backend

# Check GPU
echo "🎮 Checking GPU..."
python -c "import torch; print(f'CUDA: {torch.cuda.is_available()}')"

# Check model
if [ -f "models/best.pt" ]; then
    echo "✅ Model found"
else
    echo "❌ Model not found! Upload best.pt to models/"
    exit 1
fi

# Start server
echo "🚀 Starting server..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Make executable and run:
```bash
chmod +x start.sh
./start.sh
```

---

## 🎯 Quick Checklist

- [ ] Sign up for RunPod
- [ ] Add $10 credits
- [ ] Deploy GPU Pod (RTX 3060+)
- [ ] SSH into pod
- [ ] Clone repository
- [ ] Install dependencies with GPU PyTorch
- [ ] Upload best.pt model
- [ ] Verify GPU detected
- [ ] Start backend server
- [ ] Test health endpoint
- [ ] Update frontend .env.local
- [ ] Test WebSocket connection

---

## 📞 Support

**RunPod Issues:**
- Discord: https://discord.gg/runpod
- Docs: https://docs.runpod.io

**Project Issues:**
- Check backend logs: `tail -f server.log`
- Test model: `python -m app.models.yolo_model`
- GPU check: `nvidia-smi`

---

**Total Setup Time: ~10-15 minutes**
**Monthly Cost: ~$10-15 (24/7) or $3-5 (8hrs/day)**

Ready to deploy! 🚀
