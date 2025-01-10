import os
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path


def run_modal_deploy(file_path: Path) -> int:
    """Deploy a Modal function file.

    Args:
        file_path: Path to the Modal function file

    Returns:
        Exit code from the deployment process
    """
    command = ["modal", "deploy", str(file_path)]
    process = subprocess.Popen(
        command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
    )

    # Stream output in real-time
    for stream in [process.stdout, process.stderr]:
        if stream:
            for line in stream:
                prefix = "(ERROR)" if stream == process.stderr else ""
                print(
                    f"{file_path.name} {prefix}: {line.strip()}",
                    file=sys.stderr if prefix else sys.stdout,
                )

    return process.wait()


def main() -> None:
    """Deploy all Python files in the remote/functions directory."""
    # Use Path for better path handling
    functions_dir = Path("remote/functions")
    if not functions_dir.exists():
        print(f"Error: Directory {functions_dir} not found", file=sys.stderr)
        sys.exit(1)

    # Get all Python files
    files_to_deploy = list(functions_dir.glob("*.py"))
    if not files_to_deploy:
        print(f"No Python files found in {functions_dir}", file=sys.stderr)
        sys.exit(1)

    print(f"Deploying {len(files_to_deploy)} files...")

    # Deploy files concurrently
    with ThreadPoolExecutor(
        max_workers=min(len(files_to_deploy), os.cpu_count() or 1)
    ) as executor:
        results = list(executor.map(run_modal_deploy, files_to_deploy))

    # Check results
    failed = sum(1 for result in results if result != 0)
    if failed:
        print(f"{failed} deployment(s) failed.", file=sys.stderr)
        sys.exit(1)

    print("All deployments completed successfully.")


if __name__ == "__main__":
    main()
