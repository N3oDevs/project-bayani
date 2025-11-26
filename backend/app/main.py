from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.websockets import WebSocketDisconnect
from PIL import Image
import base64
import io

from .routes.predict import router as predict_router
from .utils.preprocess import preprocess_image
from .models.yolo_model import YOLOModel
from .config import MODEL_PATH

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
                payload = img_b64.split(",")[-1]
                content = base64.b64decode(payload)
                image = Image.open(io.BytesIO(content)).convert("RGB")
                inp = preprocess_image(image)
                preds = _ws_model.predict(inp, orig_size=image.size)
                await websocket.send_json({"predictions": preds})
            except Exception as e:
                await websocket.send_json({"error": str(e)})
    except WebSocketDisconnect:
        return

