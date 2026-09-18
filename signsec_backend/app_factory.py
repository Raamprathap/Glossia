import os
from pathlib import Path

from flask import Flask, Response, jsonify, request, send_from_directory
import requests
from flask_cors import CORS

from .config import Settings
from .db import init_db
from .http_errors import register_error_handlers
from .logging import init_audit_logging
from .rate_limit import init_rate_limiter
from .routes.auth import bp as auth_bp
from .routes.conversions import bp as conversions_bp
from .routes.media import bp as media_bp
from .routes.admin import bp as admin_bp
from .routes.legacy_transcript import bp as legacy_transcript_bp
from .routes.text_to_sign import bp as text_to_sign_bp
from .text_to_sign.fallback import ModelFallbackChain


def create_app() -> Flask:
    """
    Flask app factory.

    SECURITY: Centralized app creation makes it easier to enforce consistent
    security headers, CORS policy, auth middleware, and logging everywhere.
    """
    app = Flask(__name__)

    settings = Settings.from_env()
    app.config["SETTINGS"] = settings
    app.config["JSON_SORT_KEYS"] = True  # stable signing / predictable output

    # SECURITY: tighten in production (set explicit origins), but keep permissive for local lab.
    CORS(app, resources={r"/api/*": {"origins": settings.cors_origins}})

    init_db(app, settings)
    init_rate_limiter(app, settings)
    init_audit_logging(app, settings)

    register_error_handlers(app)

    # API routes (security lab project)
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(conversions_bp, url_prefix="/api/conversions")
    app.register_blueprint(media_bp, url_prefix="/api/media")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")

    # Keep existing functionality available (now will be protected later via RBAC if needed)
    app.register_blueprint(legacy_transcript_bp, url_prefix="/api")

    # Seq2seq models the avatar falls back to when its dictionary keeps missing.
    app.extensions["text_to_sign"] = ModelFallbackChain(
        settings.text_to_sign_checkpoint_dir, settings.text_to_sign_model_order
    )
    app.register_blueprint(text_to_sign_bp, url_prefix="/api/text-to-sign")

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok"})

    repository_root = Path(__file__).resolve().parent.parent
    avatar_root = repository_root / "cwasa-runtime"
    avatar_upstream = "https://vhg.cmp.uea.ac.uk/tech/jas/vhg2017/"

    @app.get("/avatar/remote/<path:filename>")
    def avatar_remote_file(filename: str):
        upstream_headers = {"Accept-Encoding": "identity"}
        if request.headers.get("Range"):
            upstream_headers["Range"] = request.headers["Range"]

        response = requests.get(
            f"{avatar_upstream}{filename}",
            headers=upstream_headers,
            timeout=20,
        )
        response.raise_for_status()

        content = response.content
        content_type = response.headers.get("Content-Type", "application/octet-stream")
        if filename == "cwa/cwacfg.json":
            config = response.json()
            config["jasBase"] = "/avatar/remote/"
            content = app.json.dumps(config).encode("utf-8")
            content_type = "application/json"

        passthrough_headers = {}
        for header_name in ("Accept-Ranges", "Content-Range", "Content-Length"):
            header_value = response.headers.get(header_name)
            if header_value:
                passthrough_headers[header_name] = header_value

        return Response(
            content,
            status=response.status_code,
            content_type=content_type,
            headers=passthrough_headers,
        )

    @app.get("/avatar/<path:filename>")
    def avatar_file(filename: str):
        if filename == "SignFiles/sigmlData.json":
            sigml_path = avatar_root / filename
            content = sigml_path.read_text(encoding="utf-16").encode("utf-8")
            return Response(content, content_type="application/json; charset=utf-8")
        response = send_from_directory(avatar_root, filename, max_age=0)
        response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        return response

    return app


