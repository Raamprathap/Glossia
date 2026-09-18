from __future__ import annotations

import re
from collections import Counter
from typing import Dict, Iterable, List

PAD_TOKEN = "<pad>"
SOS_TOKEN = "<sos>"
EOS_TOKEN = "<eos>"
UNK_TOKEN = "<unk>"
SPECIAL_TOKENS = [PAD_TOKEN, SOS_TOKEN, EOS_TOKEN, UNK_TOKEN]
PAD_IDX, SOS_IDX, EOS_IDX, UNK_IDX = range(len(SPECIAL_TOKENS))

# Same normalisation as the avatar page: captions carry punctuation
# ("everyone," / "today.") that dictionary glosses don't.
_EDGE_PUNCTUATION = re.compile(r"^[\W_]+|[\W_]+$")


def tokenize(text: str) -> List[str]:
    """Lower-cased words with leading/trailing punctuation removed."""
    words = (_EDGE_PUNCTUATION.sub("", word) for word in text.lower().split())
    return [word for word in words if word]


class Vocabulary:
    """Token <-> index mapping. Indices 0-3 are always the special tokens."""

    def __init__(self, tokens: Iterable[str]):
        self.itos: List[str] = list(SPECIAL_TOKENS)
        for token in tokens:
            if token not in SPECIAL_TOKENS:
                self.itos.append(token)
        self.stoi: Dict[str, int] = {token: i for i, token in enumerate(self.itos)}

    @classmethod
    def build(cls, sentences: Iterable[List[str]], min_freq: int = 1) -> "Vocabulary":
        counts = Counter(token for sentence in sentences for token in sentence)
        return cls(sorted(token for token, n in counts.items() if n >= min_freq))

    def __len__(self) -> int:
        return len(self.itos)

    def __contains__(self, token: str) -> bool:
        return token in self.stoi

    def encode(self, tokens: List[str]) -> List[int]:
        """Token ids wrapped in <sos> ... <eos>."""
        return [SOS_IDX] + [self.stoi.get(t, UNK_IDX) for t in tokens] + [EOS_IDX]

    def decode(self, ids: Iterable[int]) -> List[str]:
        """Tokens up to the first <eos>, without special tokens."""
        tokens = []
        for i in ids:
            if i == EOS_IDX:
                break
            if i >= len(SPECIAL_TOKENS):
                tokens.append(self.itos[i])
        return tokens

    def to_list(self) -> List[str]:
        return list(self.itos)

    @classmethod
    def from_list(cls, itos: List[str]) -> "Vocabulary":
        return cls(itos)
