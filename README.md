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
4. Matched keywords are mapped to ASL hand shapes
5. The floating overlay is updated with the sign animation
6. The popup polls the content script for live status

---

## 🧠 Extending

To add more signs, edit the `ASL_SIGNS` object in `popup.js` and `ASL_HAND_SHAPES` + `HAND_SVG_PATHS` in `content.js`.

To add a new platform's captions, append its CSS selector to `CAPTION_SELECTORS` in `content.js`.

---

_Built with ❤️ for accessibility and inclusion._
