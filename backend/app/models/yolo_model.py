from typing import List, Dict, Any, Tuple
import numpy as np
import os
from pathlib import Path

try:
    import torch
    from ultralytics import YOLO
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    YOLO = None


class YOLOModel:
    def __init__(self, model_path: str | None = None) -> None:
        self.model_path = model_path
        self.model = None
        self.device = 'cpu'
        
        # Auto-detect model path if not provided
        if not model_path:
            possible_paths = [
                'best.pt',
                'models/best.pt',
                '../models/best.pt',
                '/app/models/best.pt',  # Docker path
            ]
            for path in possible_paths:
                if os.path.exists(path):
                    model_path = path
                    break
        
        if TORCH_AVAILABLE and model_path and os.path.exists(model_path):
            try:
                # Check if CUDA is available
                if torch.cuda.is_available():
                    self.device = 'cuda'
                    print(f"✅ Using GPU: {torch.cuda.get_device_name(0)}")
                else:
                    print("⚠️ GPU not available, using CPU")
                
                # Load YOLOv9 model
                self.model = YOLO(model_path)
                self.model.to(self.device)
                print(f"✅ Model loaded from {model_path}")
                print(f"📊 Model classes: {self.model.names}")
            except Exception as e:
                print(f"❌ Error loading model: {e}")
                self.model = None
        else:
            if not TORCH_AVAILABLE:
                print("❌ PyTorch not installed. Install with: pip install torch ultralytics")
            elif not model_path:
                print("⚠️ No model path provided. Place best.pt in backend/ or models/ folder")
            elif not os.path.exists(model_path):
                print(f"⚠️ Model not found at {model_path}")
    
    def is_loaded(self) -> bool:
        """Check if model is loaded and ready"""
        return self.model is not None
    
    def predict(self, image: np.ndarray, conf: float = 0.25) -> List[Dict[str, Any]]:
        """Run inference on image"""
        if not self.is_loaded():
            return []
        
        try:
            # Run inference
            results = self.model.predict(
                image,
                conf=conf,
                device=self.device,
                verbose=False
            )
            
            # Parse results
            detections = []
            for result in results:
                boxes = result.boxes
                for i in range(len(boxes)):
                    box = boxes[i]
                    x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                    confidence = float(box.conf[0].cpu().numpy())
                    class_id = int(box.cls[0].cpu().numpy())
                    label = self.model.names[class_id]
                    
                    detections.append({
                        "bbox": [float(x1), float(y1), float(x2), float(y2)],
                        "score": confidence,
                        "label": label,
                        "class_id": class_id
                    })
            
            return detections
        except Exception as e:
            print(f"❌ Prediction error: {e}")
            return []
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get model information"""
        if not self.is_loaded():
            return {
                "loaded": False,
                "error": "Model not loaded"
            }
        
        return {
            "loaded": True,
            "device": self.device,
            "classes": self.model.names,
            "model_path": self.model_path
        }

