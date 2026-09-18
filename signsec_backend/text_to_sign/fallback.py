from __future__ import annotations

import logging
import threading
from dataclasses import dataclass
from pathlib import Path
from typing import TYPE_CHECKING, List, Optional, Tuple

from .sign_dictionary import SignDictionary

if TYPE_CHECKING:  # importing it for real needs PyTorch
    from .translator import ModelTranslator

logger = logging.getLogger(__name__)

# Most capable model first; the simpler ones are further fallbacks.
DEFAULT_MODEL_ORDER = ["transformer", "lstm_attention", "rnn"]


@dataclass
class FallbackResult:
    model: str
    glosses: List[str]


class ModelFallbackChain:
    """
    Tries each trained model in order until one returns glosses the avatar
    can sign.

    Models load on first use, from ``<checkpoint_dir>/<model name>.pt``. A
    model without a checkpoint is skipped (an untrained model only produces
    noise), and without PyTorch the chain is simply unavailable, so the
    backend runs the same with or without the ML dependencies installed.
    """

    def __init__(self, checkpoint_dir: Path, model_order: List[str] = DEFAULT_MODEL_ORDER, device: str = "cpu"):
        self.checkpoint_dir = Path(checkpoint_dir)
        self.model_order = model_order
        self.device = device
        self._translators: List[Tuple[str, "ModelTranslator"]] = []
        self._dictionary: Optional[SignDictionary] = None
        self._loaded = False
        self._lock = threading.Lock()

    def _load(self) -> None:
        with self._lock:
            if self._loaded:
                return
            self._loaded = True
            try:
                from .translator import ModelTranslator
            except ImportError:
                logger.warning("PyTorch is not installed; text-to-sign model fallback is disabled")
                return

            for name in self.model_order:
                path = self.checkpoint_dir / f"{name}.pt"
                if not path.is_file():
                    logger.info("No checkpoint for text-to-sign model %r at %s", name, path)
                    continue
                try:
                    self._translators.append((name, ModelTranslator(path, self.device)))
                except Exception:
                    logger.exception("Could not load text-to-sign model %r from %s", name, path)
            if self._translators:
                self._dictionary = SignDictionary.load()

    @property
    def available(self) -> bool:
        self._load()
        return bool(self._translators)

    def translate(self, text: str) -> Optional[FallbackResult]:
        self._load()
        for name, translator in self._translators:
            try:
                glosses = translator.translate(text)
            except Exception:
                logger.exception("Text-to-sign model %r failed; trying the next one", name)
                continue
            signable = [gloss for gloss in glosses if gloss in self._dictionary]
            if signable:
                return FallbackResult(model=name, glosses=signable)
        return None
