"""
Entry point for the SignSec backend.

This file used to contain the entire Flask app. It now delegates to a
security-focused app factory in `signsec_backend/`.
"""

import os

from signsec_backend import create_app

app = create_app()


if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "5000"))
    app.run(host=host, port=port, debug=os.getenv("FLASK_DEBUG", "0") == "1")