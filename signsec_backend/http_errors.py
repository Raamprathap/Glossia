from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Optional

from flask import Flask, jsonify


@dataclass
class ApiError(Exception):
    status_code: int
    code: str
    message: str
    details: Optional[Dict[str, Any]] = None


def register_error_handlers(app: Flask) -> None:
    @app.errorhandler(ApiError)
    def handle_api_error(err: ApiError):
        payload = {"error": {"code": err.code, "message": err.message}}
        if err.details:
            payload["error"]["details"] = err.details
        return jsonify(payload), err.status_code

    @app.errorhandler(404)
    def handle_404(_):
        return jsonify({"error": {"code": "not_found", "message": "Not found"}}), 404

    @app.errorhandler(ValueError)
    def handle_value_error(err: ValueError):
        # SECURITY: Convert common validation errors into 400 responses (avoid leaking stack traces / 500 noise).
        return jsonify({"error": {"code": "invalid_request", "message": str(err)}}), 400


