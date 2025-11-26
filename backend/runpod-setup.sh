#!/bin/bash
# RunPod GPU Setup Script for Project Bayani

echo "🎮 Project Bayani - GPU Backend Setup"
echo "======================================"

# Check if running on GPU instance
if command -v nvidia-smi &> /dev/null; then
    echo "✅ GPU Detected:"
    nvidia-smi --query-gpu=name,memory.total --format=csv,noheader
else
    echo "⚠️  WARNING: No GPU detected! This will run on CPU (slow for YOLOv9)"
fi

# Navigate to workspace
cd /workspace || cd /app || cd ~

# Clone repository if not exists
if [ ! -d "project-bayani" ]; then
    echo ""
    echo "📥 Cloning repository..."
    git clone https://github.com/N3oDevs/project-bayani.git
    cd project-bayani/backend
else
    echo ""
    echo "📁 Repository already exists"
    cd project-bayani/backend
    git pull
fi

# Install PyTorch with CUDA support
echo ""
echo "🔧 Installing PyTorch with CUDA support..."
pip install -q torch torchvision --index-url https://download.pytorch.org/whl/cu118

# Install other dependencies
echo "📦 Installing dependencies..."
pip install -q -r requirements.txt

# Verify GPU with PyTorch
echo ""
echo "🧪 Testing GPU with PyTorch..."
python << EOF
import torch
print(f"PyTorch Version: {torch.__version__}")
print(f"CUDA Available: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"CUDA Version: {torch.version.cuda}")
    print(f"GPU Device: {torch.cuda.get_device_name(0)}")
    print(f"GPU Memory: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.2f} GB")
else:
    print("⚠️  CUDA not available - will use CPU")
EOF

# Create models directory
mkdir -p models

# Check for model
echo ""
if [ -f "models/best.pt" ]; then
    echo "✅ Model found: models/best.pt"
    ls -lh models/best.pt
else
    echo "⚠️  Model NOT found!"
    echo ""
    echo "📤 Please upload your best.pt model to: $(pwd)/models/"
    echo ""
    echo "Options to upload:"
    echo "1. Via Jupyter: Navigate to backend/models/ and click Upload"
    echo "2. Via SCP: scp -P <port> best.pt root@<pod-id>-ssh.runpod.io:/workspace/project-bayani/backend/models/"
    echo "3. Via wget: wget 'YOUR_URL' -O models/best.pt"
    echo ""
fi

# Get public URL
echo ""
echo "🌐 Your Backend URLs:"
echo "================================"
POD_ID=$(hostname | cut -d'-' -f1)
echo "HTTP API:  https://${POD_ID}-8000.proxy.runpod.net"
echo "WebSocket: wss://${POD_ID}-8000.proxy.runpod.net/ws/predict"
echo "Health:    https://${POD_ID}-8000.proxy.runpod.net/health"
echo ""

# Provide next steps
echo "🚀 Next Steps:"
echo "================================"
echo "1. Upload your best.pt model (if not done)"
echo "2. Start the server:"
echo "   uvicorn app.main:app --host 0.0.0.0 --port 8000"
echo ""
echo "3. Update your frontend/.env.local:"
echo "   NEXT_PUBLIC_API_BASE_URL=https://${POD_ID}-8000.proxy.runpod.net"
echo "   NEXT_PUBLIC_WS_URL=wss://${POD_ID}-8000.proxy.runpod.net/ws/predict"
echo ""
echo "4. Test the API:"
echo "   curl https://${POD_ID}-8000.proxy.runpod.net/health"
echo ""
echo "✅ Setup complete!"
