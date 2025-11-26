import os

ROOT = os.path.dirname(__file__)
MODEL_PATH = os.getenv("MODEL_PATH", os.path.join(ROOT, "models", "best.pt"))
