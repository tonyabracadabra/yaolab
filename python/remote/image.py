from pathlib import Path

from modal import Image

local_dir = Path(__file__).parent.parent.absolute()

PROJECT_DIR = "/root"

image = (
    Image.debian_slim(python_version="3.12.8")
    .pip_install("uv")
    .workdir(PROJECT_DIR)
    .copy_local_dir(local_dir, PROJECT_DIR)
    .run_commands(
        "uv pip install --system --compile-bytecode -r pyproject.toml",
    )
)
