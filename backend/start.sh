#!/bin/bash
# Quick start script for backend on GPU

echo "🚀 Starting Project Bayani Backend..."

# Check GPU
echo "🎮 GPU Status:"
python -c "import torch; print(f'CUDA Available: {torch.cuda.is_available()}'); print(f'Device: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else \"CPU\"}')"

# Check model
if [ ! -f "models/best.pt" ]; then
    echo "❌ ERROR: models/best.pt not found!"
    echo "Please upload your model first."
    exit 1
fi

echo "✅ Model found: $(ls -lh models/best.pt | awk '{print $9, $5}')"

# Start server
echo ""
echo "🌐 Starting server on port 8000..."
echo "Press Ctrl+C to stop"
echo ""

uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
