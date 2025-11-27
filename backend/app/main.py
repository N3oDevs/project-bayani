from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.websockets import WebSocketDisconnect
from PIL import Image
import base64
import io
import numpy as np
from typing import Dict
from collections import defaultdict
import asyncio
import json
import time

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
        print(f"[signaling] join role={role} room={room}")
        rooms[room][role] = websocket
        other = "webapp" if role == "hardware" else "hardware"
        peer = rooms[room].get(other)
        if peer:
            try:
                print(f"[signaling] notify {other} of peer_joined role={role} room={room}")
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
                        print(f"[signaling] forward type={mtype} from={role} to={'webapp' if role=='hardware' else 'hardware'} room={room}")
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
                print(f"[signaling] disconnect role={role} room={room}")
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

@app.websocket("/ws/audio")
async def ws_audio(websocket: WebSocket):
    await websocket.accept()
    is_recording = False
    is_paused = False
    task: asyncio.Task | None = None
    try:
        while True:
            try:
                msg = await websocket.receive_text()
                data = json.loads(msg)
                action = data.get("action")
            except Exception:
                action = None
            if action == "start_recording":
                is_recording = True
                is_paused = False
                await websocket.send_json({"status": "recording_started"})
                if task is None or task.done():
                    task = asyncio.create_task(stream_audio_to_client(websocket, lambda: is_recording and not is_paused))
            elif action == "pause":
                is_paused = True
                await websocket.send_json({"status": "paused"})
            elif action == "resume":
                is_paused = False
                await websocket.send_json({"status": "resumed"})
            elif action == "stop":
                is_recording = False
                await websocket.send_json({"status": "stopped"})
                break
            elif action == "cancel":
                is_recording = False
                await websocket.send_json({"status": "cancelled"})
                break
    except WebSocketDisconnect:
        return
    except Exception as e:
        try:
            await websocket.send_json({"error": str(e)})
        except Exception:
            pass

async def stream_audio_to_client(websocket: WebSocket, should_continue):
    try:
        while should_continue():
            await asyncio.sleep(0.1)
            await websocket.send_bytes(b"\x00" * 1024)
    except Exception:
        pass

@app.websocket("/ws/gps")
async def ws_gps(websocket: WebSocket):
    await websocket.accept()
    is_tracking = False
    task: asyncio.Task | None = None
    try:
        while True:
            try:
                message = await asyncio.wait_for(websocket.receive_text(), timeout=0.1)
                data = json.loads(message)
                action = data.get("action")
            except asyncio.TimeoutError:
                action = None
            except Exception:
                action = None
            if action == "start_tracking":
                is_tracking = True
                await websocket.send_json({"status": "tracking_started"})
                if task is None or task.done():
                    task = asyncio.create_task(stream_gps_location(websocket, lambda: is_tracking))
            elif action == "stop_tracking":
                is_tracking = False
                await websocket.send_json({"status": "tracking_stopped"})
    except WebSocketDisconnect:
        return
    except Exception as e:
        try:
            await websocket.send_json({"error": str(e)})
        except Exception:
            pass

async def stream_gps_location(websocket: WebSocket, should_continue):
    try:
        while should_continue():
            gps_data = {
                "latitude": 14.5995,
                "longitude": 120.9842,
                "accuracy": 10.5,
                "altitude": 15.0,
                "speed": 0.0,
                "heading": None,
                "timestamp": int(time.time() * 1000),
            }
            await websocket.send_json(gps_data)
            await asyncio.sleep(2)
    except Exception:
        pass

