import os
from pathlib import Path

# Ensure KERAS_HOME defaults to local workspace directory
os.environ.setdefault("KERAS_HOME", str(Path(__file__).resolve().parent.parent / ".keras"))
