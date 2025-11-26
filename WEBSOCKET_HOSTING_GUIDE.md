# WebSocket Hosting Options for Project Bayani

## 🎮 GPU-Enabled Hosting (Required for YOLOv9 Camera Detection)

### 1. **RunPod** (Best for GPU) ⭐ RECOMMENDED
- **GPU Available**: ✅ NVIDIA GPUs (RTX 3090, RTX 4090, A40, etc.)
- **Cost**: ~$0.30-0.50/hour (~$7-15/mo if running 24/7)
- **WebSocket Support**: ✅ Full support
- **Setup Time**: 10 minutes

**Pros:**
- Pay-per-second billing (stop when not using)
- Pre-built PyTorch/CUDA images
- SSH + Jupyter access
- Fast GPU deployment
- Can save custom templates

**Cons:**
- Need to manage server
- Spot instances can be interrupted

**Setup:**
```bash
# 1. Sign up at runpod.io
# 2. Add funds ($10 minimum)
# 3. Deploy Pod:
#    - Template: PyTorch 2.0
#    - GPU: RTX 3060 or better
#    - Disk: 20GB
#    - Expose HTTP Ports: 8000

# 4. SSH into pod and clone repo
ssh root@<pod-id>.runpod.io
git clone https://github.com/N3oDevs/project-bayani.git
cd project-bayani/backend

# 5. Install dependencies
pip install -r requirements.txt
pip install onnxruntime-gpu  # GPU-accelerated ONNX

# 6. Start server
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Your WebSocket URL: wss://<pod-id>.runpod.io/ws/predict
```

**Cost Optimization:**
- Use Spot instances (cheaper, can be interrupted)
- Stop pod when not in use
- Auto-scale based on demand

---

### 2. **Vast.ai** (Cheapest GPU)
- **GPU Available**: ✅ Various NVIDIA GPUs
- **Cost**: ~$0.10-0.30/hour (~$3-10/mo)
- **WebSocket Support**: ✅ Full support
- **Setup Time**: 15 minutes

**Pros:**
- Cheapest GPU option
- Marketplace pricing (bid for lower prices)
- Wide GPU selection
- SSH access

**Cons:**
- Quality varies by provider
- Instances can be unreliable
- Manual setup required

**Setup:**
```bash
# 1. Sign up at vast.ai
# 2. Search for GPU instance:
#    - GPU: RTX 3060 or better
#    - Min RAM: 16GB
#    - Min Storage: 20GB
#    - Check "SSH" and "Direct SSH"

# 3. Rent instance and SSH
ssh root@<instance-ip> -p <port>

# 4. Setup Python environment
apt update && apt install -y python3-pip git
git clone https://github.com/N3oDevs/project-bayani.git
cd project-bayani/backend
pip install -r requirements.txt
pip install onnxruntime-gpu

# 5. Start server
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

---

### 3. **Google Colab** (Free GPU - Development Only)
- **GPU Available**: ✅ Tesla T4 (free), A100/V100 (paid)
- **Cost**: FREE (limited hours) or $9.99/mo for Colab Pro
- **WebSocket Support**: ⚠️ Via ngrok tunnel
- **Setup Time**: 5 minutes

**Pros:**
- FREE GPU access
- Pre-installed ML libraries
- Jupyter notebook interface
- Good for testing

**Cons:**
- Sessions timeout after 12 hours
- Not for production
- Need ngrok for WebSocket
- Limited to development

**Setup:**
```python
# In Google Colab notebook:

# 1. Enable GPU: Runtime → Change runtime type → GPU (T4)

# 2. Install dependencies
!git clone https://github.com/N3oDevs/project-bayani.git
%cd project-bayani/backend
!pip install -r requirements.txt
!pip install onnxruntime-gpu pyngrok

# 3. Setup ngrok tunnel
from pyngrok import ngrok
import nest_asyncio
nest_asyncio.apply()

# Get authtoken from ngrok.com
ngrok.set_auth_token("YOUR_NGROK_TOKEN")

# Start FastAPI
import uvicorn
from app.main import app

# Create tunnel
public_url = ngrok.connect(8000)
print(f"WebSocket URL: {public_url.replace('http', 'wss')}/ws/predict")

# Run server
uvicorn.run(app, host="0.0.0.0", port=8000)
```

---

### 4. **Azure ML Compute** (Enterprise GPU)
- **GPU Available**: ✅ NVIDIA V100, A100, K80
- **Cost**: ~$0.90-3.00/hour
- **WebSocket Support**: ✅ Full support
- **Setup Time**: 20 minutes

**Pros:**
- Enterprise-grade infrastructure
- Azure ecosystem integration
- Auto-scaling
- Managed service

**Cons:**
- Expensive
- Complex setup
- Requires Azure account

---

### 5. **AWS EC2 with GPU** (g4dn.xlarge)
- **GPU Available**: ✅ NVIDIA T4
- **Cost**: ~$0.526/hour (~$380/mo 24/7)
- **WebSocket Support**: ✅ Full support
- **Setup Time**: 25 minutes

**Pros:**
- AWS ecosystem
- Reliable infrastructure
- Spot instances available (cheaper)

**Cons:**
- Expensive for 24/7
- Complex AWS setup
- Need to manage EC2 instance

**Cost Optimization:**
- Use Spot instances (60-70% cheaper)
- Auto-stop when idle
- Reserve instances for long-term

---

### 6. **Lambda Cloud GPU** (Specialized ML Cloud)
- **GPU Available**: ✅ RTX 6000 Ada, A100, H100
- **Cost**: ~$0.50-2.00/hour
- **WebSocket Support**: ✅ Full support
- **Setup Time**: 10 minutes

**Pros:**
- ML-optimized infrastructure
- Simple pricing
- Pre-configured CUDA
- Good for ML workloads

**Cons:**
- Limited regions
- Minimum commitment
- Waitlist for popular GPUs

---

### 7. **Paperspace Gradient** (ML Platform)
- **GPU Available**: ✅ RTX 4000, RTX 5000, A4000, A5000, A6000
- **Cost**: ~$0.51-0.76/hour (RTX 4000)
- **WebSocket Support**: ✅ Full support
- **Setup Time**: 10 minutes

**Pros:**
- ML-focused platform
- Jupyter notebooks included
- Easy deployment
- Good documentation

**Cons:**
- More expensive than Vast.ai
- Limited free tier

---

### 8. **Banana.dev / Modal** (Serverless GPU)
- **GPU Available**: ✅ Various NVIDIA GPUs
- **Cost**: Pay-per-inference ($0.0001-0.001 per call)
- **WebSocket Support**: ⚠️ Limited (HTTP/REST better)
- **Setup Time**: 30 minutes

**Pros:**
- True serverless (no idle costs)
- Auto-scaling
- Pay per use
- Easy deployment

**Cons:**
- Cold start delays (1-5 seconds)
- Better for REST API than WebSocket
- Model loading time

---

## 🏆 GPU Hosting Recommendation for Project Bayani

### For Development/Testing:
**Google Colab (Free)** → Test YOLOv9 for free

### For Production (24/7):
**RunPod GPU Pod** → Best price/performance (~$10-15/mo)

### For Budget:
**Vast.ai** → Cheapest (~$3-10/mo)

### For Enterprise:
**Azure ML Compute** → Managed, scalable, reliable

---

## 💡 Hybrid Architecture (Recommended)

Split your services:

```
┌─────────────────────────────────────────┐
│  Frontend (Vercel/Netlify)             │
│  - Next.js UI                           │
│  - Free hosting                         │
└────────────┬────────────────────────────┘
             │
             ├─────────────────────────────┐
             │                             │
             ▼                             ▼
┌────────────────────────┐   ┌────────────────────────┐
│  GPU Server (RunPod)   │   │  API Server (Render)   │
│  - YOLOv9 Detection    │   │  - Voice Recording     │
│  - Camera Processing   │   │  - GPS Tracking        │
│  - WebSocket (/ws)     │   │  - Database APIs       │
│  $10-15/mo             │   │  FREE                  │
└────────────────────────┘   └────────────────────────┘
             │                             │
             └─────────────┬───────────────┘
                           ▼
              ┌─────────────────────────┐
              │  Supabase (Database)    │
              │  - Voice Recordings     │
              │  - GPS Logs             │
              │  FREE                   │
              └─────────────────────────┘
```

**Benefits:**
- GPU only for heavy processing
- Other services on free tier
- Total cost: ~$10-15/mo

---

## ⚡ Cost Comparison (24/7 for 1 Month)

| Service | GPU Type | Cost/Month | Best For |
|---------|----------|------------|----------|
| **Vast.ai** | RTX 3060 | ~$70-100 | Budget |
| **RunPod** | RTX 3060 | ~$100-150 | Balanced |
| **Google Colab Pro** | T4 | $10 (12hr limit) | Development |
| **Lambda Cloud** | RTX 6000 | ~$360 | Production |
| **AWS g4dn.xlarge** | T4 | ~$380 | Enterprise |
| **Paperspace** | RTX 4000 | ~$370 | ML Platform |

**💡 Cost-Saving Tip:** Use **on-demand** billing and auto-stop when idle:
- Active 8hrs/day: ~$30-50/mo
- Active 4hrs/day: ~$15-25/mo

---

## 🚀 Quick Start: RunPod GPU Setup

### Step 1: Prepare Your Code

Update `backend/requirements.txt`:
```txt
fastapi
uvicorn[standard]
python-multipart
onnxruntime-gpu  # GPU version
numpy
Pillow
websockets
python-dotenv
```

### Step 2: Deploy to RunPod

1. **Sign up**: https://runpod.io
2. **Add funds**: $10 minimum
3. **Deploy Pod**:
   - Click "Deploy" → "GPU Cloud"
   - Template: **PyTorch 2.0** or **RunPod Pytorch**
   - GPU: **RTX 3060** (cheapest) or **RTX 3090** (faster)
   - Container Disk: 20GB
   - Volume: Optional (for model storage)
   - Expose HTTP Ports: `8000`
   - Click "Deploy On-Demand**

4. **Connect via SSH**:
```bash
ssh root@<your-pod-id>-ssh.runpod.io -i ~/.ssh/runpod
```

5. **Setup Application**:
```bash
# Clone repo
git clone https://github.com/N3oDevs/project-bayani.git
cd project-bayani/backend

# Install dependencies
pip install -r requirements.txt

# Verify GPU
python -c "import torch; print(torch.cuda.is_available())"

# Start server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

6. **Get Public URL**:
```
RunPod provides: https://<pod-id>-8000.proxy.runpod.net
WebSocket URL: wss://<pod-id>-8000.proxy.runpod.net/ws/predict
```

### Step 3: Update Frontend

```bash
# frontend/.env.local
NEXT_PUBLIC_API_BASE_URL=https://<pod-id>-8000.proxy.runpod.net
NEXT_PUBLIC_WS_URL=wss://<pod-id>-8000.proxy.runpod.net/ws/predict
```

---

## 🛠️ Optimize GPU Performance

### 1. Use GPU-Accelerated ONNX Runtime

Update `backend/app/models/yolo_model.py`:

```python
import onnxruntime as ort
import numpy as np

class YOLOModel:
    def __init__(self, model_path: str):
        # Check for GPU
        providers = ['CUDAExecutionProvider', 'CPUExecutionProvider']
        
        # Create ONNX session with GPU
        self.session = ort.InferenceSession(
            model_path,
            providers=providers
        )
        
        # Check if using GPU
        if 'CUDAExecutionProvider' in self.session.get_providers():
            print("✅ Using GPU for inference")
        else:
            print("⚠️ Using CPU for inference")
```

### 2. Batch Processing for Multiple Cameras

```python
# Process multiple frames at once
def batch_predict(self, frames: list):
    batch = np.stack(frames)  # Shape: (batch_size, 3, 640, 640)
    results = self.session.run(None, {"images": batch})
    return results
```

### 3. Model Quantization (Faster Inference)

```bash
# Convert to FP16 for 2x speed
python -m onnxruntime.quantization.quantize_dynamic \
    --model_input yolov9-c.onnx \
    --model_output yolov9-c-fp16.onnx \
    --weight_type fp16
```

---

## 📊 GPU Requirements for YOLOv9

| Model | Min VRAM | Recommended | FPS (1080p) |
|-------|----------|-------------|-------------|
| YOLOv9-t | 2GB | 4GB | 60+ |
| YOLOv9-s | 4GB | 6GB | 45+ |
| YOLOv9-m | 6GB | 8GB | 30+ |
| YOLOv9-c | 8GB | 12GB | 25+ |
| YOLOv9-e | 12GB | 16GB | 15+ |

**Recommended for your project:** RTX 3060 (12GB VRAM) → Can handle YOLOv9-c at 25+ FPS

---

## 🔧 Development Workflow

1. **Develop locally** (CPU, slower but free)
2. **Test on Google Colab** (Free GPU, 12hr sessions)
3. **Deploy to RunPod** (Production GPU, pay-per-use)
4. **Auto-stop when idle** (Save costs)

---

## 📝 Non-GPU Hosting Options

## ⭐ CPU-Only Options (For Non-GPU Services)

### 1. **Render** (Best Free Option - CPU Only)
- **Free Tier**: Yes (with auto-sleep after 15 min inactivity)
- **WebSocket Support**: ✅ Full support
- **Deployment**: Git-based (auto-deploy from GitHub)
- **Setup Time**: 5 minutes

**Pros:**
- Easy deployment (connect GitHub repo)
- Automatic HTTPS/WSS
- Free tier available
- Good for FastAPI + WebSocket

**Cons:**
- Free tier sleeps after 15 min inactivity (30-60s wake time)
- Need paid plan ($7/mo) for always-on

**Setup:**
```bash
# 1. Create render.yaml in project root
cat > render.yaml << 'EOF'
services:
  - type: web
    name: bayani-backend
    env: python
    buildCommand: pip install -r backend/requirements.txt
    startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
    healthCheckPath: /health
EOF

# 2. Push to GitHub
# 3. Connect repo at render.com
# 4. Your WebSocket URL: wss://bayani-backend.onrender.com/ws/predict
```

---

### 2. **Railway** (Best Developer Experience)
- **Free Tier**: $5 free credits/month (enough for small projects)
- **WebSocket Support**: ✅ Excellent
- **Deployment**: Git-based or CLI
- **Setup Time**: 3 minutes

**Pros:**
- No sleep on free tier
- Automatic HTTPS/WSS
- Built-in monitoring
- Great CLI tools
- PostgreSQL/Redis included

**Cons:**
- Free credits limited ($5/mo)
- Pay-as-you-go after credits

**Setup:**
```bash
# 1. Install Railway CLI
npm i -g @railway/cli

# 2. Login and init
railway login
railway init

# 3. Deploy
railway up

# Your WebSocket URL: wss://your-app.railway.app/ws/predict
```

---

### 3. **Fly.io** (Best for Global Edge)
- **Free Tier**: Yes (generous limits)
- **WebSocket Support**: ✅ Full support
- **Deployment**: CLI-based
- **Setup Time**: 10 minutes

**Pros:**
- Free tier includes 3 shared-cpu VMs
- Global edge deployment (low latency)
- Auto-scaling
- PostgreSQL included

**Cons:**
- Slightly more complex setup
- Need credit card (not charged on free tier)

**Setup:**
```bash
# 1. Install flyctl
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"

# 2. Login
flyctl auth login

# 3. Launch app
cd backend
flyctl launch

# 4. Deploy
flyctl deploy

# Your WebSocket URL: wss://bayani-backend.fly.dev/ws/predict
```

---

### 4. **Azure Container Apps** (Best for Enterprise)
- **Free Tier**: Yes (with Azure free account)
- **WebSocket Support**: ✅ Full support
- **Deployment**: Docker-based
- **Setup Time**: 15 minutes

**Pros:**
- Part of Microsoft Azure ecosystem
- Excellent for scaling
- Built-in load balancing
- Good for production

**Cons:**
- More complex setup
- Requires Azure account
- Costs after free tier

**Setup:**
```bash
# 1. Install Azure CLI
winget install Microsoft.AzureCLI

# 2. Login
az login

# 3. Create container app
az containerapp up \
  --name bayani-backend \
  --source ./backend \
  --ingress external \
  --target-port 8000

# Your WebSocket URL: wss://bayani-backend.azurecontainerapps.io/ws/predict
```

---

### 5. **AWS App Runner** (AWS Alternative)
- **Free Tier**: Limited free tier
- **WebSocket Support**: ✅ Full support
- **Deployment**: Docker or source-based
- **Setup Time**: 15 minutes

**Pros:**
- AWS ecosystem integration
- Auto-scaling
- Pay-per-use pricing

**Cons:**
- Requires AWS account
- More expensive than alternatives
- Complex billing

---

### 6. **Google Cloud Run** (Serverless Option)
- **Free Tier**: 2M requests/month free
- **WebSocket Support**: ✅ Supported
- **Deployment**: Docker-based
- **Setup Time**: 10 minutes

**Pros:**
- Generous free tier
- Auto-scaling to zero
- Pay only for usage
- Global deployment

**Cons:**
- WebSocket connections count against request limits
- Cold start delays
- Requires Google Cloud account

**Setup:**
```bash
# 1. Install gcloud CLI
# Download from: https://cloud.google.com/sdk/docs/install

# 2. Login
gcloud auth login

# 3. Deploy
gcloud run deploy bayani-backend \
  --source ./backend \
  --allow-unauthenticated \
  --region asia-southeast1

# Your WebSocket URL: wss://bayani-backend-xxx.a.run.app/ws/predict
```

---

### 7. **Heroku** (Classic Option)
- **Free Tier**: ❌ Removed (paid only now)
- **WebSocket Support**: ✅ Full support
- **Deployment**: Git-based
- **Cost**: Starts at $5/mo

**Note:** Heroku removed free tier in 2022, now paid only.

---

### 8. **DigitalOcean App Platform**
- **Free Tier**: Yes (limited)
- **WebSocket Support**: ✅ Full support
- **Deployment**: Git or Docker
- **Cost**: Free for static, $5/mo for backend

**Pros:**
- Simple setup
- Good documentation
- Predictable pricing

**Cons:**
- Free tier very limited for backends
- Less features than competitors

---

### 9. **Self-Hosted VPS** (Most Control)

**Options:**
- **DigitalOcean Droplet**: $4/mo
- **Linode**: $5/mo
- **Vultr**: $2.50/mo
- **AWS EC2 t2.micro**: Free tier 1 year

**Pros:**
- Full control
- No restrictions
- Cheapest for high traffic

**Cons:**
- Need to manage server
- Security updates
- SSL certificate setup

**Setup (DigitalOcean Example):**
```bash
# 1. Create droplet on DigitalOcean
# 2. SSH into server
ssh root@your-server-ip

# 3. Install dependencies
apt update
apt install python3-pip nginx certbot

# 4. Clone repo and setup
git clone https://github.com/N3oDevs/project-bayani.git
cd project-bayani/backend
pip3 install -r requirements.txt

# 5. Setup Nginx reverse proxy for WebSocket
cat > /etc/nginx/sites-available/bayani << 'EOF'
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
EOF

# 6. Get SSL certificate
certbot --nginx -d your-domain.com

# 7. Start app with PM2 or systemd
pip3 install pm2
pm2 start "uvicorn app.main:app --host 0.0.0.0 --port 8000"
pm2 save
pm2 startup
```

---

### 10. **Cloudflare Workers + Durable Objects** (Edge Computing)
- **Free Tier**: 100,000 requests/day
- **WebSocket Support**: ✅ Via Durable Objects
- **Deployment**: CLI-based
- **Setup Time**: 20 minutes (complex)

**Pros:**
- Global edge network
- Extremely fast
- Generous free tier

**Cons:**
- Complex setup for Python apps
- Limited to JavaScript/Wasm
- Not suitable for FastAPI

---

## 🏆 Final Recommendation for Project Bayani (GPU + WebSocket)

### GPU Service (YOLOv9 Camera Detection):

| Use Case | Recommended Host | Cost | Reason |
|----------|-----------------|------|--------|
| **Development/Testing** | Google Colab Free | Free (12hr) | Test GPU for free |
| **Production (Best)** | RunPod GPU Pod | $10-15/mo | Best price/performance |
| **Production (Budget)** | Vast.ai | $3-10/mo | Cheapest GPU option |
| **Production (Enterprise)** | Azure ML Compute | $200+/mo | Managed, scalable |
| **Serverless** | Banana.dev/Modal | Pay-per-use | No idle costs |

### Non-GPU Services (Voice, GPS, APIs):

| Use Case | Recommended Host | Cost | Reason |
|----------|-----------------|------|--------|
| **Testing/Development** | Render Free | Free | Easy setup, auto-deploy |
| **Always-On Free** | Railway | Free ($5/mo credits) | No sleep, great DX |
| **Production (Small)** | Fly.io | Free → $5/mo | Global edge, auto-scale |
| **Production (Enterprise)** | Azure Container Apps | Pay-as-you-go | Azure ecosystem, scaling |
| **Full Control** | DigitalOcean VPS | $4/mo | Complete control, cheap |

---

## 🚀 Quick Start: Deploy to Render (Recommended)

### Step 1: Prepare Backend

Create `render.yaml` in project root:

```yaml
services:
  - type: web
    name: bayani-backend
    env: python
    region: singapore
    plan: free
    buildCommand: cd backend && pip install -r requirements.txt
    startCommand: cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.0
    healthCheckPath: /
```

### Step 2: Add Health Check to Backend

Add to `backend/app/main.py`:

```python
@app.get("/")
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "Project Bayani Backend"}
```

### Step 3: Update Frontend ENV

Update `frontend/.env.local`:

```bash
# Production (after deployment)
NEXT_PUBLIC_API_BASE_URL=https://bayani-backend.onrender.com
NEXT_PUBLIC_WS_URL=wss://bayani-backend.onrender.com/ws/predict
NEXT_PUBLIC_AUDIO_WS_URL=wss://bayani-backend.onrender.com/ws/audio
NEXT_PUBLIC_GPS_WS_URL=wss://bayani-backend.onrender.com/ws/gps
```

### Step 4: Deploy

1. Push code to GitHub
2. Go to https://render.com
3. Sign up with GitHub
4. Click "New" → "Web Service"
5. Connect your repository
6. Render auto-detects `render.yaml`
7. Click "Create Web Service"

**Your WebSocket URL:** `wss://bayani-backend.onrender.com/ws/predict`

---

## 🌐 Frontend Hosting Options

### For Next.js Frontend:

| Host | Free Tier | Best For |
|------|-----------|----------|
| **Vercel** | Yes | Next.js (recommended) |
| **Netlify** | Yes | Static sites |
| **Cloudflare Pages** | Yes | Global edge |
| **GitHub Pages** | Yes | Static only |

**Recommended:** Deploy frontend to **Vercel**, backend to **Render**

---

## 📊 Comparison Table

| Feature | Render | Railway | Fly.io | Azure | VPS |
|---------|--------|---------|--------|-------|-----|
| **Free Tier** | ✅ (sleeps) | ✅ ($5 credits) | ✅ | ✅ (limited) | ❌ |
| **WebSocket** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Setup Time** | 5 min | 3 min | 10 min | 15 min | 30 min |
| **Auto-Deploy** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Scaling** | ✅ | ✅ | ✅ | ✅✅ | Manual |
| **SSL/WSS** | Auto | Auto | Auto | Auto | Manual |
| **Cold Start** | 30-60s | None | None | None | None |
| **Monitoring** | Basic | ✅ | ✅ | ✅✅ | Manual |

---

## 🔒 Security Considerations

### Always Use WSS (not WS)
```javascript
// ❌ Insecure
const ws = new WebSocket('ws://example.com/ws')

// ✅ Secure
const ws = new WebSocket('wss://example.com/ws')
```

### Add CORS Configuration

In `backend/app/main.py`:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-frontend.vercel.app",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 📝 Environment Variables

Create `.env.production` for production:

```bash
# Backend
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
SUPABASE_URL=https://...
SUPABASE_KEY=...
CORS_ORIGINS=https://your-frontend.vercel.app

# Frontend
NEXT_PUBLIC_API_BASE_URL=https://bayani-backend.onrender.com
NEXT_PUBLIC_WS_URL=wss://bayani-backend.onrender.com/ws/predict
```

---

## 🎯 Action Plan

**For immediate testing:**
1. Deploy backend to **Render** (5 minutes, free)
2. Deploy frontend to **Vercel** (3 minutes, free)
3. Update environment variables
4. Test WebSocket connection

**For production:**
1. Start with **Railway** or **Fly.io** (no cold starts)
2. Add monitoring (Sentry, LogRocket)
3. Setup CI/CD with GitHub Actions
4. Add database (Supabase already setup)

---

**Ready to deploy! Want me to help you set up Render deployment?** 🚀
