from __future__ import annotations

from abc import ABC, abstractmethod
from typing import List

import torch
from torch import nn

from ..tokenization import EOS_IDX, PAD_IDX, SOS_IDX


class Seq2SeqModel(nn.Module, ABC):
    """
    Common interface of the three text -> sign-gloss models.

    Inputs are padded id tensors of shape (batch, length) whose sequences
    start with <sos> and end with <eos>. Training uses teacher forcing:
    ``forward(src, tgt[:, :-1])`` predicts ``tgt[:, 1:]``.
    """

    @abstractmethod
    def forward(self, src: torch.Tensor, tgt_in: torch.Tensor) -> torch.Tensor:
        """Logits of shape (batch, tgt_len, tgt_vocab_size)."""

    @abstractmethod
    def greedy_decode(self, src: torch.Tensor, max_len: int) -> torch.Tensor:
        """Predicted target ids of shape (batch, <= max_len), without <sos>."""

    @staticmethod
    def source_mask(src: torch.Tensor) -> torch.Tensor:
        """True where ``src`` holds a real token rather than padding."""
        return src != PAD_IDX

    @staticmethod
    def start_tokens(src: torch.Tensor) -> torch.Tensor:
        return torch.full((src.size(0),), SOS_IDX, dtype=torch.long, device=src.device)

    @staticmethod
    def all_finished(predictions: List[torch.Tensor]) -> bool:
        """True once every sequence in the batch has produced <eos>."""
        return bool(torch.stack(predictions, dim=1).eq(EOS_IDX).any(dim=1).all())
