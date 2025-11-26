from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from PIL import Image
import io

from ..utils.preprocess import preprocess_image
from ..models.yolo_model import YOLOModel
from ..config import MODEL_PATH

router = APIRouter(prefix="", tags=["inference"])

model = YOLOModel(MODEL_PATH)

@router.post("/predict")
async def predict(file: UploadFile = File(...)):
    try:
        content = await file.read()
        image = Image.open(io.BytesIO(content)).convert("RGB")
        inp = preprocess_image(image)
        preds = model.predict(inp, orig_size=image.size, pil_image=image)
        return JSONResponse({"predictions": preds})
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
