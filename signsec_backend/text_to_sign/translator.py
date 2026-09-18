from __future__ import annotations

from pathlib import Path
from typing import List

import torch

from .checkpoints import load_checkpoint
from .tokenization import tokenize

MAX_OUTPUT_GLOSSES = 64


class ModelTranslator:
    """Runs one trained model: English text -> sign glosses."""

    def __init__(self, checkpoint_path: Path, device: str = "cpu"):
        self.device = device
        self.name, self.model, self.src_vocab, self.tgt_vocab = load_checkpoint(checkpoint_path, device)

    def translate(self, text: str) -> List[str]:
        tokens = tokenize(text)
        # Text made only of words the model never saw (names, typos) would
        # decode to an unrelated sentence; leave it to fingerspelling.
        if not any(token in self.src_vocab for token in tokens):
            return []
        src = torch.tensor([self.src_vocab.encode(tokens)], dtype=torch.long, device=self.device)
        # Gloss sequences are usually no longer than the sentence they come from.
        max_len = min(2 * len(tokens) + 2, MAX_OUTPUT_GLOSSES)
        predicted = self.model.greedy_decode(src, max_len)
        return self.tgt_vocab.decode(predicted[0].tolist())
