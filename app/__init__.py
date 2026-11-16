import os
from pathlib import Path

# Ensure KERAS_HOME and MPLCONFIGDIR are isolated to the project directory
_project_root = Path(__file__).resolve().parent.parent
_local_keras = _project_root / ".keras"
_local_keras.mkdir(parents=True, exist_ok=True)
os.environ.setdefault("KERAS_HOME", str(_local_keras))

_local_mpl = _project_root / ".matplotlib"
_local_mpl.mkdir(parents=True, exist_ok=True)
os.environ.setdefault("MPLCONFIGDIR", str(_local_mpl))
