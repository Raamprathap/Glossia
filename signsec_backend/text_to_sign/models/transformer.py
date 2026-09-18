"""Model 3: Transformer encoder-decoder (Vaswani et al., 2017)."""

from __future__ import annotations

import math

import torch
from torch import nn

from ..tokenization import PAD_IDX
from .base import Seq2SeqModel


class PositionalEncoding(nn.Module):
    """Adds fixed sinusoidal position signals to token embeddings."""

    def __init__(self, d_model: int, dropout: float, max_len: int = 512):
        super().__init__()
        position = torch.arange(max_len).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2) * (-math.log(10000.0) / d_model))
        pe = torch.zeros(max_len, d_model)
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        self.register_buffer("pe", pe.unsqueeze(0), persistent=False)  # (1, max_len, D)
        self.dropout = nn.Dropout(dropout)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.dropout(x + self.pe[:, : x.size(1)])


class TransformerSeq2Seq(Seq2SeqModel):
    def __init__(
        self,
        src_vocab_size: int,
        tgt_vocab_size: int,
        d_model: int = 256,
        nhead: int = 4,
        num_encoder_layers: int = 3,
        num_decoder_layers: int = 3,
        dim_feedforward: int = 512,
        dropout: float = 0.1,
    ):
        super().__init__()
        self.d_model = d_model
        self.src_embedding = nn.Embedding(src_vocab_size, d_model, padding_idx=PAD_IDX)
        self.tgt_embedding = nn.Embedding(tgt_vocab_size, d_model, padding_idx=PAD_IDX)
        self.positional_encoding = PositionalEncoding(d_model, dropout)
        encoder_layer = nn.TransformerEncoderLayer(d_model, nhead, dim_feedforward, dropout, batch_first=True)
        self.encoder = nn.TransformerEncoder(
            encoder_layer, num_encoder_layers, norm=nn.LayerNorm(d_model), enable_nested_tensor=False
        )
        decoder_layer = nn.TransformerDecoderLayer(d_model, nhead, dim_feedforward, dropout, batch_first=True)
        self.decoder = nn.TransformerDecoder(decoder_layer, num_decoder_layers, norm=nn.LayerNorm(d_model))
        self.fc_out = nn.Linear(d_model, tgt_vocab_size)

    def encode(self, src: torch.Tensor) -> torch.Tensor:
        """Self-attention over the English tokens -> memory of shape (B, S, D)."""
        embedded = self.positional_encoding(self.src_embedding(src) * math.sqrt(self.d_model))
        return self.encoder(embedded, src_key_padding_mask=~self.source_mask(src))

    def decode(self, tgt_in: torch.Tensor, memory: torch.Tensor, src: torch.Tensor) -> torch.Tensor:
        """Masked self-attention over the glosses so far + cross-attention to memory."""
        embedded = self.positional_encoding(self.tgt_embedding(tgt_in) * math.sqrt(self.d_model))
        # True above the diagonal: position t may not attend to later glosses.
        length = tgt_in.size(1)
        causal_mask = torch.ones(length, length, dtype=torch.bool, device=tgt_in.device).triu(diagonal=1)
        output = self.decoder(
            embedded,
            memory,
            tgt_mask=causal_mask,
            tgt_is_causal=True,
            tgt_key_padding_mask=tgt_in == PAD_IDX,
            memory_key_padding_mask=~self.source_mask(src),
        )
        return self.fc_out(output)  # (B, T, V)

    def forward(self, src: torch.Tensor, tgt_in: torch.Tensor) -> torch.Tensor:
        return self.decode(tgt_in, self.encode(src), src)

    @torch.no_grad()
    def greedy_decode(self, src: torch.Tensor, max_len: int) -> torch.Tensor:
        memory = self.encode(src)
        generated = self.start_tokens(src).unsqueeze(1)  # (B, 1)
        predictions = []
        for _ in range(max_len):
            token = self.decode(generated, memory, src)[:, -1].argmax(dim=-1)
            predictions.append(token)
            generated = torch.cat([generated, token.unsqueeze(1)], dim=1)
            if self.all_finished(predictions):
                break
        return torch.stack(predictions, dim=1)
