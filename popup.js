// ============================================================
// Glossia – Popup Logic (popup.js)
// ============================================================

const ASL_GLOSSES = new Set([
    'HELLO', 'THANK', 'YES', 'NO', 'LOVE', 'HELP',
    'PLEASE', 'SORRY', 'STOP', 'MORE', 'GOOD', 'BAD',
    'WANT', 'NEED', 'WAIT', 'NAME',
]);

// DOM refs — Main View
const mainView = document.getElementById('mainView');
const settingsView = document.getElementById('settingsView');
const openSettings = document.getElementById('openSettings');
const backBtn = document.getElementById('backBtn');
const statusChip = document.getElementById('statusChip');
const chipLabel = document.getElementById('chipLabel');
const signWord = document.getElementById('signWord');
const signLang = document.getElementById('signLang');
const confFill = document.getElementById('confFill');
const captionBody = document.getElementById('captionBody');
const signFlash = document.getElementById('signFlash');
const statSigns = document.getElementById('statSigns');
const statTime = document.getElementById('statTime');
const statPlatform = document.getElementById('statPlatform');
const popupAvatarFrame = document.getElementById('popupAvatarFrame');

// DOM refs — Settings
const masterToggle = document.getElementById('masterToggle');
const captionToggle = document.getElementById('captionToggle');
const avatarToggle = document.getElementById('avatarToggle');
const langSelect = document.getElementById('langSelect');

// --- Defaults ---
const DEFAULTS = {
    enabled: true, position: 'bottom-right', size: 'medium',
    language: 'ASL', showAvatar: true, captionSource: 'auto'
};

let settings = { ...DEFAULTS };
let signsCount = 0;
let sessionStart = Date.now();
let popupAvatarReady = false;
let pendingPopupText = null;

popupAvatarFrame.addEventListener('load', () => {
    popupAvatarReady = false;
    console.log('[Glossia] Popup avatar iframe loaded; waiting for CWASA');
});

window.addEventListener('message', (event) => {
    if (
        event.origin !== 'http://localhost:5000' ||
        event.source !== popupAvatarFrame?.contentWindow ||
        event.data?.type !== 'AVATAR_READY'
    ) return;

    popupAvatarReady = true;
    console.log('[Glossia] Popup avatar renderer ready');
    if (pendingPopupText) {
        const text = pendingPopupText;
        pendingPopupText = null;
        sendTranscriptToPopupAvatar(text);
    }
});

// --- Boot ---
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    startTimer();
    bindNav();
    bindSettings();
    pollStatus();
    startDemo();
});

// --- Navigation ---
function bindNav() {
    openSettings.addEventListener('click', () => {
        mainView.classList.add('hidden');
        settingsView.classList.remove('hidden');
    });
    backBtn.addEventListener('click', () => {
        settingsView.classList.add('hidden');
        mainView.classList.remove('hidden');
    });
}

// --- Settings Persistence ---
function loadSettings() {
    chrome.storage.sync.get(null, (stored) => {
        if (stored && Object.keys(stored).length) {
            settings = { ...DEFAULTS, ...stored };
        }
        applySettingsUI();
    });
}

function applySettingsUI() {
    masterToggle.checked = settings.enabled !== false;
    captionToggle.checked = settings.captionSource !== 'off';
    avatarToggle.checked = settings.showAvatar !== false;
    langSelect.value = settings.language || 'ASL';
    signLang.textContent = settings.language || 'ASL';

    document.querySelectorAll('.pos-cell').forEach(b =>
        b.classList.toggle('active', b.dataset.pos === (settings.position || 'bottom-right'))
    );
    document.querySelectorAll('.seg-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.size === (settings.size || 'medium'))
    );
}

// Save to storage AND send directly to the active tab
function save() {
    chrome.storage.sync.set(settings);

    // Direct push to active tab content script (most reliable for immediate feedback)
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (!tab || !tab.id) return;
        // Skip chrome:// pages where content scripts can't run
        if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('about:')) return;

        chrome.tabs.sendMessage(tab.id, { type: 'SETTINGS_UPDATE', settings }, () => {
            // Suppress "no receiving end" errors — storage.onChanged acts as fallback
            void chrome.runtime.lastError;
        });
    });
}

function bindSettings() {
    masterToggle.addEventListener('change', () => {
        settings.enabled = masterToggle.checked;
        save();
    });

    captionToggle.addEventListener('change', () => {
        settings.captionSource = captionToggle.checked ? 'auto' : 'off';
        save();
    });

    avatarToggle.addEventListener('change', () => {
        settings.showAvatar = avatarToggle.checked;
        save();
    });

    langSelect.addEventListener('change', () => {
        settings.language = langSelect.value;
        signLang.textContent = langSelect.value;
        save();
    });

    document.querySelectorAll('.pos-cell').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.pos-cell').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            settings.position = btn.dataset.pos;
            save();
        });
    });

    document.querySelectorAll('.seg-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            settings.size = btn.dataset.size;
            save();
        });
    });
}

// --- Session Timer ---
function startTimer() {
    setInterval(() => {
        const s = Math.floor((Date.now() - sessionStart) / 1000);
        statTime.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    }, 1000);
}

// --- Content Script Poll ---
function pollStatus() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0]) return;
        chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_STATUS' }, (res) => {
            if (chrome.runtime.lastError || !res) { setChip(false, 'No video'); return; }
            setChip(res.videoFound, res.videoFound ? res.platform || 'Video' : 'No video');
            if (res.platform) statPlatform.textContent = res.platform;
            if (res.currentCaption) showSign(res.currentCaption);
        });
    });
    setTimeout(pollStatus, 2500);
}

function setChip(active, label) {
    statusChip.classList.toggle('active', active);
    chipLabel.textContent = label;
}

// --- Sign Display ---
function showSign(caption) {
    const upper = caption.toUpperCase();
    let matched = null;
    for (const key of ASL_GLOSSES) {
        if (upper.includes(key)) { matched = key; break; }
    }

    signFlash.classList.remove('flash');
    void signFlash.offsetWidth;
    signFlash.classList.add('flash');

    signWord.style.opacity = '0';
    setTimeout(() => {
        signWord.textContent = matched || caption.slice(0, 14);
        signWord.style.opacity = '1';
    }, 100);

    captionBody.textContent = caption.length > 60 ? caption.slice(0, 60) + '…' : caption;
    sendTranscriptToPopupAvatar(caption);

    const conf = matched ? 72 + Math.floor(Math.random() * 26) : 38 + Math.floor(Math.random() * 20);
    confFill.style.width = `${conf}%`;

    signsCount++;
    statSigns.textContent = signsCount;
}

function sendTranscriptToPopupAvatar(text) {
    if (!text || !popupAvatarFrame || !popupAvatarFrame.contentWindow) return;
    if (!popupAvatarReady) {
        pendingPopupText = text;
        return;
    }
    console.log('[Glossia] Sending transcript to popup avatar:', text);
    popupAvatarFrame.contentWindow.postMessage({ type: 'PLAY_TEXT', text }, '*');
}

// --- Demo Mode ---
const DEMO_WORDS = [...ASL_GLOSSES];
let demoIdx = 0;
let demoTimer = null;

function startDemo() {
    setTimeout(() => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]) { runDemo(); return; }
            chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_STATUS' }, (res) => {
                if (chrome.runtime.lastError || !res || !res.videoFound) runDemo();
            });
        });
    }, 2000);
}

function runDemo() {
    if (demoTimer) return;
    captionBody.textContent = 'Demo mode — no video detected';
    demoTimer = setInterval(() => {
        showSign(DEMO_WORDS[demoIdx % DEMO_WORDS.length]);
        demoIdx++;
    }, 2200);
}
