from typing import List, Dict, Any, Tuple
import numpy as np

try:
    import onnxruntime as ort
except Exception:
    ort = None


class YOLOModel:
    def __init__(self, model_path: str | None) -> None:
        self.model_path = model_path
        self.session = None
        if ort and model_path:
            try:
                self.session = ort.InferenceSession(model_path, providers=["CPUExecutionProvider"])
            except Exception:
                self.session = None

    def predict(self, input_tensor: np.ndarray, orig_size: Tuple[int, int]) -> List[Dict[str, Any]]:
        if self.session is None:
            return []
        inputs = {self.session.get_inputs()[0].name: input_tensor}
        outputs = self.session.run(None, inputs)
        boxes = self._postprocess(outputs, orig_size)
        return boxes

    def _postprocess(self, outputs: list, orig_size: Tuple[int, int]) -> List[Dict[str, Any]]:
        w, h = orig_size
        result: List[Dict[str, Any]] = []
        if not outputs:
            return result
        preds = outputs[0]
        if preds is None:
            return result
        # This is a placeholder postprocess; adapt to your specific model output
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

