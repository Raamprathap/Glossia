from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List, Optional

DEFAULT_SIGML_PATH = (
    Path(__file__).resolve().parents[2] / "cwasa-runtime" / "SignFiles" / "sigmlData.json"
)


class SignDictionary:
    """
    The avatar's gloss -> SiGML dictionary (the same file the avatar page uses).

    Its glosses are the models' output vocabulary, so every gloss a model
    predicts is one the avatar can sign.
    """

    def __init__(self, entries: Dict[str, str]):
        self._sigml = entries

    @classmethod
    def load(cls, path: Path = DEFAULT_SIGML_PATH) -> "SignDictionary":
        # The file is UTF-16 encoded (see the /avatar route in app_factory.py).
        data = json.loads(Path(path).read_text(encoding="utf-16"))
        entries = {}
        for item in data:
            gloss = item["w"].lower()
            # Skip annotated duplicates such as "A (Case Conflict)".
            if " " not in gloss:
                entries[gloss] = item["s"]
        return cls(entries)

    @property
    def glosses(self) -> List[str]:
        return sorted(self._sigml)

    def __contains__(self, gloss: str) -> bool:
        return gloss in self._sigml

    def sigml(self, gloss: str) -> Optional[str]:
        return self._sigml.get(gloss)
