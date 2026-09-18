# 🤟 Glossia – Sign Language Overlay Chrome Extension

> A real-time sign language display overlay that detects videos on any website and shows the corresponding ASL (or BSL/ISL/Auslan) hand signs in a beautiful floating widget.

---

## ✨ Features

| Feature                  | Description                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------------- |
| 🎥 **Video Detection**   | Auto-detects video players on YouTube, Netflix, Twitch, Vimeo, Coursera, Udemy, and more |
| 💬 **Caption Scraping**  | Reads live captions/subtitles directly from the page DOM                                 |
| 🤟 **ASL Sign Display**  | Animated SVG hand shapes for ASL signs in a glowing avatar                               |
| 🪟 **Draggable Overlay** | Floating widget on the page—drag anywhere, minimize, or close                            |
| ⚙️ **Popup Controls**    | Full settings panel: position, size, language, and toggle                                |
| 📊 **Session Stats**     | Tracks signs shown, session time, and accuracy                                           |
| 🌐 **Multi-language**    | ASL 🇺🇸, BSL 🇬🇧, ISL 🇮🇳, Auslan 🇦🇺                                                        |

---

## 📁 File Structure

```
SignLang-Extension/
├── manifest.json       # Chrome Manifest V3
├── background.js       # Service worker
├── content.js          # Video/caption detection + overlay injection
├── overlay.css         # In-page overlay styles (glassmorphism)
├── popup.html          # Extension popup UI
├── popup.css           # Popup styles
├── popup.js            # Popup logic (settings, sign display)
└── icons/
    ├── icon16.svg
    ├── icon48.svg
    └── icon128.svg
```

---

## 🚀 Installation (Developer Mode)

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **"Load unpacked"**
4. Select the `SignLang-Extension` folder from your Documents
5. Pin the extension from the puzzle icon in the toolbar

---

## 🎨 UI Design

The extension uses a **glassmorphism dark theme** with:

- `#0d0d1a` deep dark background
- `#a78bfa` purple + `#38bdf8` cyan gradient accents
- Animated glowing SVG hand avatar
- Floating in-page overlay with drag support
- Live caption ticker scroll
- Smooth micro-animations on sign transitions

---

## 🔧 How It Works

1. **content.js** is injected into every page
2. It scans for `<video>` elements and identifies the platform
3. A `MutationObserver` watches for caption/subtitle text changes
4. Caption text is sent to the CWASA avatar, which signs each word from the sign dictionary or fingerspells it
5. The floating overlay shows the avatar and a ticker with the sentence being signed
6. The popup polls the content script for live status

### Meetings (Google Meet, Microsoft Teams)

- The overlay appears once you join the call, even with every camera off.
- Signing is driven by the meeting's own live captions. Glossia turns captions on in Meet automatically (once per call). In Teams, turn them on via **More → Language and speech → Show live captions**.
- New caption words are signed in order as people speak, instead of restarting on every update. If speech outpaces the avatar, older queued words are skipped so the signing stays close to live.
- The avatar is embedded through `avatar-host.html`, an extension page. Meeting sites refuse to frame `http://localhost:5000` directly: Teams blocks it with its Content-Security-Policy, and Chrome's Local Network Access check blocks it on other sites unless you allow the permission prompt.
- The caption selectors live in `MEETING_ADAPTERS` in `content.js`. Meet and Teams change their markup from time to time, so update them there if signing stops while captions are visible.

### Model fallback (text → sign)

The dictionary lookup in `cwasa-runtime/avatarnew.html` stays the main converter. Every word it cannot find counts as a failure; after `MODEL_FALLBACK_AFTER_FAILURES` (3) misses in a row, missed words are also sent to `POST /api/text-to-sign`, which asks three seq2seq models for sign glosses, in this order:

1. Transformer encoder-decoder (`signsec_backend/text_to_sign/models/transformer.py`)
2. LSTM Seq2Seq + Bahdanau attention (`models/lstm_attention.py`)
3. Vanilla RNN Seq2Seq (`models/rnn_seq2seq.py`)

The first model whose glosses are in the sign dictionary wins; if none helps, the word is fingerspelled as before. A dictionary hit resets the count. The whole flow is described in `signsec_backend/text_to_sign/__init__.py`.

The models are optional and untrained until you train them:

```bash
pip install -r requirements-ml.txt
python -m signsec_backend.text_to_sign.train --model all   # writes signsec_backend/text_to_sign/checkpoints/<model>.pt
```

`data/sample_pairs.tsv` is only a toy set (English, a tab, then glosses) to exercise the pipeline; train on a real English → sign-gloss corpus for useful output. Without PyTorch or checkpoints the endpoint returns 503 and the avatar stops asking. `TEXT_TO_SIGN_CHECKPOINT_DIR` and `TEXT_TO_SIGN_MODEL_ORDER` override the checkpoint folder and model order.

---

## 🧠 Extending

To add more signs, add gloss → SiGML entries to `cwasa-runtime/SignFiles/sigmlData.json` (UTF-16 encoded).

To add a new platform's captions, append its CSS selector to `CAPTION_SELECTORS` in `content.js`.

---

_Built with ❤️ for accessibility and inclusion._
