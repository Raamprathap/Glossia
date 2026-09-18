"""
Train the text -> sign-gloss models.

    python -m signsec_backend.text_to_sign.train --model all
    python -m signsec_backend.text_to_sign.train --model transformer --epochs 200

The data file has one pair per line: English text, a tab, then the glosses
(space-separated, all present in the sign dictionary). The bundled
data/sample_pairs.tsv is only a toy set to exercise the pipeline; real use
needs a proper English -> sign-gloss corpus.
"""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import List, Tuple

import torch
from torch import nn
from torch.nn.utils.rnn import pad_sequence
from torch.utils.data import DataLoader

from ..config import Settings
from .checkpoints import save_checkpoint
from .models import MODEL_CLASSES, build_model, default_hyperparams
from .sign_dictionary import SignDictionary
from .tokenization import PAD_IDX, Vocabulary, tokenize

DEFAULT_DATA_PATH = Path(__file__).resolve().parent / "data" / "sample_pairs.tsv"

Pair = Tuple[List[str], List[str]]


def load_pairs(path: Path, dictionary: SignDictionary) -> List[Pair]:
    pairs = []
    for line_no, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        if not line.strip() or line.startswith("#"):
            continue
        english, glosses = line.split("\t")
        gloss_tokens = glosses.lower().split()
        unknown = [g for g in gloss_tokens if g not in dictionary]
        if unknown:
            raise ValueError(f"{path}:{line_no}: glosses not in the sign dictionary: {unknown}")
        pairs.append((tokenize(english), gloss_tokens))
    return pairs


def collate(batch: List[Tuple[torch.Tensor, torch.Tensor]]) -> Tuple[torch.Tensor, torch.Tensor]:
    src, tgt = zip(*batch)
    return (
        pad_sequence(src, batch_first=True, padding_value=PAD_IDX),
        pad_sequence(tgt, batch_first=True, padding_value=PAD_IDX),
    )


def train_model(
    name: str,
    pairs: List[Pair],
    dictionary: SignDictionary,
    checkpoint_dir: Path,
    epochs: int,
    batch_size: int,
    lr: float,
    device: str,
) -> Path:
    src_vocab = Vocabulary.build(english for english, _ in pairs)
    # Output vocabulary = every gloss the avatar can sign.
    tgt_vocab = Vocabulary(dictionary.glosses)

    hyperparams = default_hyperparams(name)
    model = build_model(name, len(src_vocab), len(tgt_vocab), **hyperparams).to(device)

    examples = [
        (torch.tensor(src_vocab.encode(english)), torch.tensor(tgt_vocab.encode(glosses)))
        for english, glosses in pairs
    ]
    loader = DataLoader(examples, batch_size=batch_size, shuffle=True, collate_fn=collate)
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)
    criterion = nn.CrossEntropyLoss(ignore_index=PAD_IDX)

    for epoch in range(1, epochs + 1):
        model.train()
        total_loss = 0.0
        for src, tgt in loader:
            src, tgt = src.to(device), tgt.to(device)
            # Teacher forcing: feed <sos> y1 .. y(n-1), predict y1 .. yn <eos>.
            logits = model(src, tgt[:, :-1])
            loss = criterion(logits.reshape(-1, logits.size(-1)), tgt[:, 1:].reshape(-1))
            optimizer.zero_grad()
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()
            total_loss += loss.item()
        if epoch % 10 == 0 or epoch == epochs:
            print(f"[{name}] epoch {epoch}/{epochs}  loss {total_loss / len(loader):.4f}")

    path = checkpoint_dir / f"{name}.pt"
    save_checkpoint(path, name, hyperparams, model, src_vocab, tgt_vocab)
    print(f"[{name}] saved {path}")
    return path


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--model", choices=[*MODEL_CLASSES, "all"], default="all")
    parser.add_argument("--data", type=Path, default=DEFAULT_DATA_PATH)
    parser.add_argument("--checkpoint-dir", type=Path, default=Path(Settings.from_env().text_to_sign_checkpoint_dir))
    parser.add_argument("--epochs", type=int, default=100)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--lr", type=float, default=1e-3)
    parser.add_argument("--device", default="cuda" if torch.cuda.is_available() else "cpu")
    args = parser.parse_args()

    dictionary = SignDictionary.load()
    pairs = load_pairs(args.data, dictionary)
    names = list(MODEL_CLASSES) if args.model == "all" else [args.model]
    for name in names:
        train_model(name, pairs, dictionary, args.checkpoint_dir, args.epochs, args.batch_size, args.lr, args.device)


if __name__ == "__main__":
    main()
