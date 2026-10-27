
from pathlib import Path
import json
import subprocess
import sys

from flask import Flask, jsonify, request, send_from_directory

ROOT = Path(__file__).resolve().parent.parent
DASHBOARD = ROOT / "dashboard"
SOURCE = ROOT / "src" / "greedy.c"
HEADER = ROOT / "include" / "greedy.h"
EXECUTABLE = ROOT / "src" / ("greedy.exe" if sys.platform.startswith("win") else "greedy")

app = Flask(__name__)


def compile_c_program():
    """Compile the C algorithm when the API starts."""
    if not SOURCE.exists() or not HEADER.exists():
        raise FileNotFoundError("C source or header file is missing.")

    subprocess.run(
        [
            "gcc",
            "-std=c11",
            "-Wall",
            "-Wextra",
            f"-I{ROOT / 'include'}",
            str(SOURCE),
            "-o",
            str(EXECUTABLE),
        ],
        check=True,
        capture_output=True,
        text=True,
    )


@app.get("/")
def home():
    return send_from_directory(DASHBOARD, "index.html")


@app.get("/<path:filename>")
def dashboard_files(filename):
    return send_from_directory(DASHBOARD, filename)


@app.get("/api/health")
def health():
    return jsonify({
        "status": "ok",
        "message": "Python API is running and connected to the C scheduler."
    })


@app.post("/api/step")
def schedule_step():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"error": "Send a JSON object."}), 400

    queues = data.get("queues")
    waiting = data.get("waiting")

    if not isinstance(queues, list) or not isinstance(waiting, list):
        return jsonify({"error": "queues and waiting must be arrays."}), 400

    if len(queues) != 4 or len(waiting) != 4:
        return jsonify({"error": "Provide exactly four queues and four waiting times."}), 400

    for values in (queues, waiting):
        for value in values:
            if type(value) is not int or value < 0 or value > 10_000_000:
                return jsonify({
                    "error": "All queue and waiting values must be non-negative integers."
                }), 400

    try:
        command = [
            str(EXECUTABLE),
            *[str(value) for value in queues],
            *[str(value) for value in waiting],
        ]

        result = subprocess.run(
            command,
            check=True,
            capture_output=True,
            text=True,
            timeout=5,
        )

        output = json.loads(result.stdout)
        return jsonify(output)

    except subprocess.TimeoutExpired:
        return jsonify({"error": "The C scheduler timed out."}), 500
    except (subprocess.CalledProcessError, json.JSONDecodeError) as error:
        details = getattr(error, "stderr", "") or str(error)
        return jsonify({"error": "C scheduler failed.", "details": details}), 500
    except OSError as error:
        return jsonify({
            "error": "Could not start the C program. Check that GCC is installed.",
            "details": str(error),
        }), 500


if __name__ == "__main__":
    try:
        compile_c_program()
        print("C greedy algorithm compiled successfully.")
        print("Dashboard: http://127.0.0.1:5000")
        app.run(host="127.0.0.1", port=5000, debug=False)
    except (FileNotFoundError, subprocess.CalledProcessError) as error:
        print("Could not prepare the C scheduler.")
        print(error)
        raise SystemExit(1)
