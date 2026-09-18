"""Model 2: bidirectional LSTM encoder + LSTM decoder with Bahdanau (additive) attention."""

from __future__ import annotations

from typing import Tuple

import torch
from torch import nn

from ..tokenization import PAD_IDX
from .base import Seq2SeqModel

LSTMState = Tuple[torch.Tensor, torch.Tensor]


class LSTMEncoder(nn.Module):
    """Bidirectional LSTM; keeps every position's output for the attention to look at."""

    def __init__(self, vocab_size: int, embed_dim: int, hidden_dim: int, dropout: float):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=PAD_IDX)
        self.lstm = nn.LSTM(embed_dim, hidden_dim, batch_first=True, bidirectional=True)
        # Both directions' final states -> the decoder's initial state.
        self.bridge_h = nn.Linear(2 * hidden_dim, hidden_dim)
        self.bridge_c = nn.Linear(2 * hidden_dim, hidden_dim)
        self.dropout = nn.Dropout(dropout)

    def forward(self, src: torch.Tensor) -> Tuple[torch.Tensor, LSTMState]:
        embedded = self.dropout(self.embedding(src))  # (B, S, E)
        outputs, (h, c) = self.lstm(embedded)         # outputs: (B, S, 2H)
        h = torch.tanh(self.bridge_h(torch.cat([h[0], h[1]], dim=-1))).unsqueeze(0)
        c = torch.tanh(self.bridge_c(torch.cat([c[0], c[1]], dim=-1))).unsqueeze(0)
        return outputs, (h, c)                        # state: (1, B, H) each


class BahdanauAttention(nn.Module):
    """score(s, h_i) = v^T tanh(W_dec s + W_enc h_i), softmaxed over source positions."""

    def __init__(self, enc_dim: int, dec_dim: int, attn_dim: int):
        super().__init__()
        self.W_enc = nn.Linear(enc_dim, attn_dim, bias=False)
        self.W_dec = nn.Linear(dec_dim, attn_dim, bias=False)
        self.v = nn.Linear(attn_dim, 1, bias=False)

    def forward(
        self, dec_hidden: torch.Tensor, enc_outputs: torch.Tensor, src_mask: torch.Tensor
    ) -> Tuple[torch.Tensor, torch.Tensor]:
        # dec_hidden: (B, H), enc_outputs: (B, S, 2H), src_mask: (B, S)
        scores = self.v(torch.tanh(self.W_enc(enc_outputs) + self.W_dec(dec_hidden).unsqueeze(1))).squeeze(-1)
        weights = torch.softmax(scores.masked_fill(~src_mask, float("-inf")), dim=-1)  # (B, S)
        context = torch.bmm(weights.unsqueeze(1), enc_outputs).squeeze(1)               # (B, 2H)
        return context, weights


class AttentionDecoder(nn.Module):
    """One decoding step: attend over the source, then update the LSTM and predict a gloss."""

    def __init__(self, vocab_size: int, embed_dim: int, enc_dim: int, hidden_dim: int, attn_dim: int, dropout: float):
        super().__init__()
        self.embedding = nn.Embedding(vocab_size, embed_dim, padding_idx=PAD_IDX)
        self.attention = BahdanauAttention(enc_dim, hidden_dim, attn_dim)
        self.lstm = nn.LSTM(embed_dim + enc_dim, hidden_dim, batch_first=True)
        self.fc_out = nn.Linear(hidden_dim + enc_dim + embed_dim, vocab_size)
        self.dropout = nn.Dropout(dropout)

    def forward(
        self, token: torch.Tensor, state: LSTMState, enc_outputs: torch.Tensor, src_mask: torch.Tensor
    ) -> Tuple[torch.Tensor, LSTMState, torch.Tensor]:
        embedded = self.dropout(self.embedding(token))                   # (B, E)
        context, weights = self.attention(state[0][-1], enc_outputs, src_mask)
        rnn_input = torch.cat([embedded, context], dim=-1).unsqueeze(1)  # (B, 1, E+2H)
        output, state = self.lstm(rnn_input, state)                      # (B, 1, H)
        logits = self.fc_out(torch.cat([output.squeeze(1), context, embedded], dim=-1))
        return logits, state, weights                                    # logits: (B, V)


class LSTMAttentionSeq2Seq(Seq2SeqModel):
    def __init__(
        self,
        src_vocab_size: int,
        tgt_vocab_size: int,
        embed_dim: int = 128,
        hidden_dim: int = 256,
        attn_dim: int = 256,
        dropout: float = 0.2,
    ):
        super().__init__()
        self.encoder = LSTMEncoder(src_vocab_size, embed_dim, hidden_dim, dropout)
        self.decoder = AttentionDecoder(tgt_vocab_size, embed_dim, 2 * hidden_dim, hidden_dim, attn_dim, dropout)

    def forward(self, src: torch.Tensor, tgt_in: torch.Tensor) -> torch.Tensor:
        enc_outputs, state = self.encoder(src)
        src_mask = self.source_mask(src)
        step_logits = []
        for t in range(tgt_in.size(1)):
            logits, state, _ = self.decoder(tgt_in[:, t], state, enc_outputs, src_mask)
            step_logits.append(logits)
        return torch.stack(step_logits, dim=1)

    @torch.no_grad()
    def greedy_decode(self, src: torch.Tensor, max_len: int) -> torch.Tensor:
        enc_outputs, state = self.encoder(src)
        src_mask = self.source_mask(src)
        token = self.start_tokens(src)
        predictions = []
        for _ in range(max_len):
            logits, state, _ = self.decoder(token, state, enc_outputs, src_mask)
            token = logits.argmax(dim=-1)
            predictions.append(token)
            if self.all_finished(predictions):
                break
        return torch.stack(predictions, dim=1)
