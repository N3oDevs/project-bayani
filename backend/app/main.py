from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.websockets import WebSocketDisconnect
from PIL import Image
import base64
import io
import numpy as np
from typing import Dict
from collections import defaultdict

from .routes.predict import router as predict_router
from .models.yolo_model import YOLOModel
from .config import MODEL_PATH
from .utils.preprocess import preprocess_image

app = FastAPI(title="Project Bayani Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict_router)

# Shared model instance for realtime websocket
_ws_model = YOLOModel(MODEL_PATH)

@app.get("/")
@app.get("/health")
async def health_check():
    """Health check endpoint for deployment platforms"""
    model_info = _ws_model.get_model_info()
    return {
        "status": "healthy",
        "service": "Project Bayani Backend",
        "model": model_info
    }

@app.get("/model/info")
async def model_info():
    """Get model information"""
    return _ws_model.get_model_info()

@app.websocket("/ws/predict")
async def ws_predict(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            img_b64 = data.get("image")
            if not img_b64:
                await websocket.send_json({"error": "missing image"})
                continue
            try:
                # Decode base64 image
                payload = img_b64.split(",")[-1]
                content = base64.b64decode(payload)
                image = Image.open(io.BytesIO(content)).convert("RGB")
                
                inp = preprocess_image(image)
                preds = _ws_model.predict(inp, orig_size=image.size, pil_image=image)
                
                await websocket.send_json({"predictions": preds})
            except Exception as e:
                await websocket.send_json({"error": str(e)})
    except WebSocketDisconnect:
        return

rooms: Dict[str, Dict[str, WebSocket]] = defaultdict(dict)

@app.websocket("/ws/signaling")
async def ws_signaling(websocket: WebSocket):
    await websocket.accept()
    room = None
    role = None
    try:
        join = await websocket.receive_json()
        room = join.get("room")
        role = join.get("role")
        t = join.get("type")
        if t != "join" or not room or role not in ("hardware", "webapp"):
            await websocket.close()
            return
        rooms[room][role] = websocket
        other = "webapp" if role == "hardware" else "hardware"
        peer = rooms[room].get(other)
        if peer:
            try:
                await peer.send_json({"type": "peer_joined", "room": room, "role": role})
            except Exception:
                pass
        while True:
            msg = await websocket.receive_json()
            mtype = msg.get("type")
            target = rooms.get(room, {}).get("webapp" if role == "hardware" else "hardware")
            if mtype in ("offer", "answer", "ice", "ready", "telemetry", "reject"):
                if target:
                    payload = dict(msg)
                    payload["from"] = role
                    try:
                        await target.send_json(payload)
                    except Exception:
                        pass
            else:
                pass
    except WebSocketDisconnect:
        other = "webapp" if role == "hardware" else "hardware"
        peer = rooms.get(room or "", {}).get(other)
        if peer:
            try:
                await peer.send_json({"type": "peer_disconnected", "room": room})
            except Exception:
                pass
        try:
            if room and role and rooms.get(room, {}).get(role) is websocket:
                del rooms[room][role]
                if not rooms[room]:
                    del rooms[room]
        except Exception:
            pass

