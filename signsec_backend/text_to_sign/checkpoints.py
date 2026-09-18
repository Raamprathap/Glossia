from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, Tuple

import torch

from .models import Seq2SeqModel, build_model
from .tokenization import Vocabulary


def save_checkpoint(
    path: Path,
    model_name: str,
    hyperparams: Dict[str, Any],
    model: Seq2SeqModel,
    src_vocab: Vocabulary,
    tgt_vocab: Vocabulary,
) -> None:
    """Everything needed to rebuild the model, stored as plain data + tensors."""
    path.parent.mkdir(parents=True, exist_ok=True)
    torch.save(
        {
            "model_name": model_name,
            "hyperparams": hyperparams,
            "src_vocab": src_vocab.to_list(),
            "tgt_vocab": tgt_vocab.to_list(),
            "state_dict": model.state_dict(),
        },
        path,
    )


def load_checkpoint(path: Path, device: str = "cpu") -> Tuple[str, Seq2SeqModel, Vocabulary, Vocabulary]:
    # SECURITY: weights_only refuses pickled code, so a tampered checkpoint
    # file cannot run arbitrary Python when loaded.
    checkpoint = torch.load(path, map_location=device, weights_only=True)
    src_vocab = Vocabulary.from_list(checkpoint["src_vocab"])
    tgt_vocab = Vocabulary.from_list(checkpoint["tgt_vocab"])
    model = build_model(checkpoint["model_name"], len(src_vocab), len(tgt_vocab), **checkpoint["hyperparams"])
    model.load_state_dict(checkpoint["state_dict"])
    model.to(device).eval()
    return checkpoint["model_name"], model, src_vocab, tgt_vocab
