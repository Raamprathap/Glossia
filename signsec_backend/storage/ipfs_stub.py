from __future__ import annotations

import hashlib
import os
from pathlib import Path


def store_encrypted_blob(*, blob: bytes, base_dir: str = "storage") -> str:
    """
    PINATA/IPFS stub: stores blob locally and returns a deterministic CID-like string.

    SECURITY: In production, you'd upload to Pinata/IPFS over TLS and store only ciphertext.
    """
    Path(base_dir).mkdir(parents=True, exist_ok=True)
    digest = hashlib.sha256(blob).hexdigest()
    cid = f"cid_{digest[:32]}"
    path = os.path.join(base_dir, f"{cid}.bin")
    with open(path, "wb") as f:
        f.write(blob)
    return cid


def fetch_encrypted_blob(*, cid: str, base_dir: str = "storage") -> bytes:
    path = os.path.join(base_dir, f"{cid}.bin")
    with open(path, "rb") as f:
        return f.read()


