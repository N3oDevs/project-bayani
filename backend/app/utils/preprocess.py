import numpy as np
from PIL import Image


def preprocess_image(img: Image.Image, size: int = 640) -> np.ndarray:
    img_resized = img.resize((size, size))
    arr = np.array(img_resized).astype(np.float32) / 255.0
    arr = arr.transpose(2, 0, 1)
    arr = np.expand_dims(arr, axis=0)
    return arr

