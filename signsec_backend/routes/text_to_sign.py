from __future__ import annotations

from flask import Blueprint, current_app, jsonify, request

from ..http_errors import ApiError

bp = Blueprint("text_to_sign", __name__)

MAX_TEXT_LENGTH = 500


@bp.post("")
def translate_with_models():
    """
    Model fallback for the avatar page's dictionary conversion (see
    signsec_backend/text_to_sign/__init__.py for the whole flow).

    Request:  {"text": "going"}
    Response: {"model": "transformer", "glosses": ["go"]}
              {"model": null, "glosses": []}  when no model could help
    503 models_unavailable when no model is trained or PyTorch is missing.
    """
    data = request.get_json(silent=True) or {}
    text = (data.get("text") or "").strip()
    if not text:
        raise ApiError(400, "invalid_request", "text is required.")
    if len(text) > MAX_TEXT_LENGTH:
        raise ApiError(400, "invalid_request", f"text must be at most {MAX_TEXT_LENGTH} characters.")

    chain = current_app.extensions["text_to_sign"]
    if not chain.available:
        raise ApiError(503, "models_unavailable", "No trained text-to-sign model is available.")

    result = chain.translate(text)
    return jsonify({
        "model": result.model if result else None,
        "glosses": result.glosses if result else [],
    })
