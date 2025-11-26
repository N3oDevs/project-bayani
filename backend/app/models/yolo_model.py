from typing import List, Dict, Any, Tuple
import numpy as np
from PIL import Image

try:
    import onnxruntime as ort
except Exception:
    ort = None

try:
    from ultralytics import YOLO as UltralyticsYOLO
except Exception:
    UltralyticsYOLO = None


class YOLOModel:
    def __init__(self, model_path: str | None) -> None:
        self.model_path = model_path
        self.session = None
        self.pt_model = None
        if model_path and model_path.lower().endswith(".pt") and UltralyticsYOLO:
            try:
                self.pt_model = UltralyticsYOLO(model_path)
            except Exception:
                self.pt_model = None
        elif ort and model_path:
            try:
                self.session = ort.InferenceSession(model_path, providers=["CPUExecutionProvider"])
            except Exception:
                self.session = None

    def predict(self, input_tensor: np.ndarray | None, orig_size: Tuple[int, int], pil_image: Image.Image | None = None) -> List[Dict[str, Any]]:
        if self.pt_model is not None:
            if pil_image is None:
                return []
            try:
                res = self.pt_model.predict(pil_image, verbose=False)
            except Exception:
                return []
            return self._postprocess_pt(res, orig_size)
        if self.session is not None and input_tensor is not None:
            inputs = {self.session.get_inputs()[0].name: input_tensor}
            outputs = self.session.run(None, inputs)
            return self._postprocess_onnx(outputs, orig_size)
        return []

    def _postprocess_onnx(self, outputs: list, orig_size: Tuple[int, int]) -> List[Dict[str, Any]]:
        result: List[Dict[str, Any]] = []
        if not outputs:
            return result
        preds = outputs[0]
        if preds is None:
            return result
        if preds.ndim == 2:
            for row in preds:
                if row.shape[0] >= 5:
                    x1, y1, x2, y2 = row[:4]
                    score = float(row[4])
                    if score < 0.25:
                        continue
                    result.append({
                        "bbox": [float(x1), float(y1), float(x2), float(y2)],
                        "score": score,
                        "label": "object",
                    })
        return result

    def _postprocess_pt(self, results: list, orig_size: Tuple[int, int]) -> List[Dict[str, Any]]:
        out: List[Dict[str, Any]] = []
        if not results:
            return out
        r = results[0]
        try:
            boxes = r.boxes
            xyxy = boxes.xyxy
            conf = boxes.conf
            cls = boxes.cls
            names = getattr(r, "names", {})
            for i in range(len(xyxy)):
                x1, y1, x2, y2 = [float(v) for v in xyxy[i].tolist()]
                score = float(conf[i].item()) if conf is not None else 0.0
                idx = int(cls[i].item()) if cls is not None else -1
                label = names[idx] if isinstance(names, dict) and idx in names else "object"
                if score < 0.25:
                    continue
                out.append({
                    "bbox": [x1, y1, x2, y2],
                    "score": score,
                    "label": label,
                })
        except Exception:
            return out
        return out
