"""
The three text -> sign-gloss models. All share the ``Seq2SeqModel`` interface,
so training, checkpoints and the fallback chain treat them the same way.
"""

from __future__ import annotations

import inspect
from typing import Any, Dict, Type

from .base import Seq2SeqModel
from .lstm_attention import LSTMAttentionSeq2Seq
from .rnn_seq2seq import RNNSeq2Seq
from .transformer import TransformerSeq2Seq

MODEL_CLASSES: Dict[str, Type[Seq2SeqModel]] = {
    "rnn": RNNSeq2Seq,                        # 1. Vanilla RNN Seq2Seq
    "lstm_attention": LSTMAttentionSeq2Seq,   # 2. LSTM Seq2Seq + Attention
    "transformer": TransformerSeq2Seq,        # 3. Transformer (encoder-decoder)
}


def default_hyperparams(name: str) -> Dict[str, Any]:
    """The constructor defaults, saved with each checkpoint so it can be rebuilt."""
    params = inspect.signature(MODEL_CLASSES[name]).parameters
    return {key: p.default for key, p in params.items() if p.default is not inspect.Parameter.empty}


def build_model(name: str, src_vocab_size: int, tgt_vocab_size: int, **hyperparams: Any) -> Seq2SeqModel:
    """Hyperparameters left out use the defaults of the model's constructor."""
    if name not in MODEL_CLASSES:
        raise ValueError(f"Unknown model {name!r}; expected one of {sorted(MODEL_CLASSES)}")
    return MODEL_CLASSES[name](src_vocab_size, tgt_vocab_size, **hyperparams)
