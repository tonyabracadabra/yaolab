from pathlib import Path

from modal import Image

local_dir = Path(__file__).parent.parent.absolute()

PROJECT_DIR = "/root"


image = (
    Image.debian_slim(python_version="3.12.8")
    .pip_install("uv")
    .workdir(PROJECT_DIR)
    # Per Modal 1.x docs: if you need to run build steps after add_local_*,
    # you must set copy=True so files are baked into the image layer.
    .add_local_dir(str(local_dir), remote_path=PROJECT_DIR, copy=True)
    # Install the project + deps from pyproject.toml
    .run_commands("uv pip install --system --compile-bytecode .")
)
