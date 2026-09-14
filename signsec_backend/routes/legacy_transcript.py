import json
import os

import requests
from flask import Blueprint, jsonify, request
from youtube_transcript_api import YouTubeTranscriptApi

bp = Blueprint("legacy_transcript", __name__)


def create_semantic_map(text: str) -> str:
    # Placeholder: insert your semantic mapping logic here
    return text


def save_transcript_to_file(video_id, transcript_data):
    """Save transcript data to both .txt and .json files"""
    os.makedirs("transcripts", exist_ok=True)

    # Save .txt file
    txt_path = os.path.join("transcripts", f"{video_id}.txt")
    with open(txt_path, "w", encoding="utf-8") as f:
        f.write(f"Transcript for YouTube video: {video_id}\n")
        f.write("-" * 50 + "\n\n")
        for segment in transcript_data:
            start = segment["start"]
            end = start + segment["duration"]
            text = segment["text"]
            f.write(f"[{start:.1f}s - {end:.1f}s] {text}\n")

    # Save .json file
    json_path = os.path.join("transcripts", f"{video_id}.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(transcript_data, f, ensure_ascii=False, indent=2)


@bp.post("/transcript")
def get_transcript():
    data = request.json or {}
    video_id = data.get("id")
    if not video_id:
        return jsonify({"error": "YouTube video ID missing"}), 400

    try:
        ytt_api = YouTubeTranscriptApi()
        transcript_list = ytt_api.list(video_id)
        transcript = transcript_list.find_transcript(["en", "ml", "ta", "hi"]).fetch()
        transcript_data = transcript.to_raw_data()

        for segment in transcript_data:
            segment["text"] = create_semantic_map(segment["text"])

        save_transcript_to_file(video_id, transcript_data)
        return jsonify(transcript_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@bp.get("/proxy")
def cors_proxy():
    """Proxy endpoint to handle CORS-blocked external requests"""
    target_url = request.args.get("url")
    if not target_url:
        return jsonify({"error": "URL parameter missing"}), 400

    try:
        response = requests.get(target_url, timeout=10)
        return jsonify(response.json()), response.status_code
    except requests.exceptions.Timeout:
        return jsonify({"error": "Request timeout"}), 504
    except requests.exceptions.RequestException as e:
        return jsonify({"error": str(e)}), 502
    except json.JSONDecodeError:
        return jsonify({"error": "Invalid JSON response"}), 500


@bp.get("/config/cwacfg.json")
def get_avatar_config():
    """Serve local avatar configuration to avoid external dependency"""
    config = {
        "jasBase": "/avatar_files/",
        "avSettings": {"avList": "avsbsl", "initAv": "marc"},
        "avsbsl": ["marc", "anna", "luna"],
    }
    return jsonify(config), 200


