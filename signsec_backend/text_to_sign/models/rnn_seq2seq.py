"""Model 1: vanilla RNN encoder-decoder (Sutskever et al., 2014 with nn.RNN cells)."""

from __future__ import annotations

from typing import Tuple

import torch
from torch import nn

from ..tokenization import PAD_IDX
from .base import Seq2SeqModel


class RNNEncoder(nn.Module):
    """Reads the English tokens; its final hidden state summarises the sentence."""

    def __init__(self, vocab_size: int, embed_dim: int, hidden_dim: int, num_layers: int, dropout: float):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=PAD_IDX)
        self.rnn = nn.RNN(
            embed_dim, hidden_dim, num_layers,
            batch_first=True, dropout=dropout if num_layers > 1 else 0.0,
        )
        self.dropout = nn.Dropout(dropout)

    def forward(self, src: torch.Tensor) -> torch.Tensor:
        embedded = self.dropout(self.embedding(src))  # (B, S, E)
        _, hidden = self.rnn(embedded)                # (layers, B, H)
        return hidden


class RNNDecoder(nn.Module):
    """Generates sign glosses from the encoder's hidden state, one token at a time."""

    def __init__(self, vocab_size: int, embed_dim: int, hidden_dim: int, num_layers: int, dropout: float):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=PAD_IDX)
        self.rnn = nn.RNN(
            embed_dim, hidden_dim, num_layers,
            batch_first=True, dropout=dropout if num_layers > 1 else 0.0,
        )
        self.fc_out = nn.Linear(hidden_dim, vocab_size)
        self.dropout = nn.Dropout(dropout)

    def forward(self, tgt_in: torch.Tensor, hidden: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        embedded = self.dropout(self.embedding(tgt_in))  # (B, T, E)
        outputs, hidden = self.rnn(embedded, hidden)     # (B, T, H)
        return self.fc_out(outputs), hidden              # (B, T, V)


class RNNSeq2Seq(Seq2SeqModel):
    def __init__(
        self,
        src_vocab_size: int,
        tgt_vocab_size: int,
        embed_dim: int = 128,
        hidden_dim: int = 256,
        num_layers: int = 2,
        dropout: float = 0.2,
    ):
        super().__init__()
        self.encoder = RNNEncoder(src_vocab_size, embed_dim, hidden_dim, num_layers, dropout)
        self.decoder = RNNDecoder(tgt_vocab_size, embed_dim, hidden_dim, num_layers, dropout)

    def forward(self, src: torch.Tensor, tgt_in: torch.Tensor) -> torch.Tensor:
        hidden = self.encoder(src)
        logits, _ = self.decoder(tgt_in, hidden)
        return logits

    @torch.no_grad()
    def greedy_decode(self, src: torch.Tensor, max_len: int) -> torch.Tensor:
        hidden = self.encoder(src)
        token = self.start_tokens(src)
        predictions = []
        for _ in range(max_len):
            logits, hidden = self.decoder(token.unsqueeze(1), hidden)
            token = logits[:, -1].argmax(dim=-1)
            predictions.append(token)
            if self.all_finished(predictions):
                break
        return torch.stack(predictions, dim=1)
