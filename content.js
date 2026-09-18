// ============================================================
// Glossia – Content Script (content.js)
// Detects video elements and scrapes captions from the page
// ============================================================

(function () {
    'use strict';

    let overlayEl = null;
    let enabled = true;
    let captionObserver = null;
    let lastCaption = '';
    let videoFound = false;
    let platform = 'Video';
    let avatarFrame = null;
    let avatarReady = false;
    let pendingAvatarMessages = [];
    let captionCheckTimer = null;
    let captionFlushTimer = null;
    let meetingCaptionsSeeded = false;
    let meetingCaptionsHandled = false;

    // The avatar is served by the local server, but embedded through an
    // extension page: meeting sites block http://localhost iframes directly.
    const AVATAR_HOST_URL = chrome.runtime.getURL('avatar-host.html');
    const AVATAR_HOST_ORIGIN = new URL(AVATAR_HOST_URL).origin;

    // Meeting captions grow word by word; a word is only sent once it is
    // followed by another word or has stayed unchanged for this long.
    const CAPTION_CHECK_MS = 150;
    const CAPTION_SETTLE_MS = 1200;

    // Current settings — kept in sync with storage
    let settings = {
        enabled: true,
        position: 'bottom-right',
        size: 'medium',
        showAvatar: true,
        captionSource: 'auto',
        language: 'ASL'
    };

    // --- ASL Sign Glosses & Hand Shapes ---
    const ASL_GLOSSES = new Set([
        'HELLO', 'THANK', 'YES', 'NO', 'LOVE', 'HELP',
        'PLEASE', 'SORRY', 'STOP', 'MORE'
    ]);

    const ASL_SHAPES = {
        HELLO: 'open', THANK: 'flat', YES: 'fist', NO: 'two',
        LOVE: 'ily', HELP: 'thumbs', PLEASE: 'flat', SORRY: 'fist',
        STOP: 'open', MORE: 'pinch'
    };

    function handSVG(shape) {
        const G = `<linearGradient id="hg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#14b8a6"/><stop offset="100%" stop-color="#0d9488"/></linearGradient>`;
        const shapes = {
            open: `<rect x="10" y="55" w="48" h="55" rx="10"/><ellipse cx="6" cy="69" rx="8" ry="14" transform="rotate(-15 6 69)"/><rect x="12" y="18" w="10" h="42" rx="5"/><rect x="25" y="12" w="10" h="47" rx="5"/><rect x="38" y="16" w="10" h="43" rx="5"/><rect x="51" y="24" w="9" h="36" rx="4.5"/>`,
            fist: `<rect x="8" y="52" w="52" h="52" rx="12"/><rect x="12" y="42" w="11" h="18" rx="6"/><rect x="26" y="38" w="11" h="18" rx="6"/><rect x="40" y="40" w="10" h="17" rx="5"/><rect x="51" y="46" w="9" h="15" rx="4.5"/><rect x="2" y="58" w="13" h="10" rx="5"/>`,
            ily: `<rect x="10" y="56" w="48" h="52" rx="10"/><rect x="3" y="40" w="12" h="26" rx="6"/><rect x="13" y="20" w="10" h="40" rx="5"/><rect x="27" y="46" w="10" h="24" rx="5"/><rect x="40" y="48" w="10" h="22" rx="5"/><rect x="53" y="18" w="9" h="42" rx="4.5"/>`,
            flat: `<rect x="4" y="58" w="60" h="28" rx="10"/><rect x="5" y="26" w="11" h="38" rx="5.5"/><rect x="19" y="18" w="11" h="46" rx="5.5"/><rect x="33" y="16" w="11" h="48" rx="5.5"/><rect x="47" y="20" w="11" h="44" rx="5.5"/><rect x="59" y="30" w="9" h="34" rx="4.5"/>`,
            thumbs: `<rect x="10" y="58" w="50" h="50" rx="12"/><rect x="14" y="48" w="11" h="18" rx="5.5"/><rect x="28" y="48" w="11" h="18" rx="5.5"/><rect x="41" y="50" w="10" h="16" rx="5"/><rect x="52" y="52" w="9" h="14" rx="4.5"/><rect x="0" y="30" w="14" h="32" rx="7"/>`,
            two: `<rect x="10" y="56" w="48" h="52" rx="10"/><ellipse cx="6" cy="70" rx="8" ry="13" transform="rotate(-15 6 70)"/><rect x="12" y="20" w="10" h="40" rx="5"/><rect x="25" y="16" w="10" h="44" rx="5"/><rect x="38" y="48" w="10" h="25" rx="5"/><rect x="51" y="50" w="9" h="23" rx="4.5"/>`,
            pinch: `<rect x="10" y="58" w="48" h="50" rx="10"/><rect x="12" y="26" w="10" h="38" rx="5"/><ellipse cx="8" cy="50" rx="7" ry="7"/><rect x="25" y="44" w="10" h="22" rx="5"/><rect x="38" y="48" w="10" h="20" rx="5"/><rect x="51" y="52" w="9" h="18" rx="4.5"/>`
        };
        // SVG attribute shorthand (w/h → width/height) for brevity
        const paths = (shapes[shape] || shapes.open)
            .replace(/\bw="/g, 'width="').replace(/\bh="/g, 'height="');
        return `<svg viewBox="0 0 68 110" xmlns="http://www.w3.org/2000/svg"><defs>${G}</defs>${paths.replace(/fill="url\(#hg\)"|(?<= )(?=<rect|<ellipse)/g, '')}</svg>`
            .replace(/<rect /g, '<rect fill="url(#hg)" ')
            .replace(/<ellipse /g, '<ellipse fill="url(#hg)" ');
    }

    // --- Platform Detection ---
    function detectPlatform() {
        const host = location.hostname;
        if (host === 'meet.google.com') return 'Google Meet';
        if (/^teams\.(microsoft|live)\.com$|^teams\.cloud\.microsoft$/.test(host)) return 'Microsoft Teams';
        if (host.includes('youtube')) return 'YouTube';
        if (host.includes('netflix')) return 'Netflix';
        if (host.includes('twitch')) return 'Twitch';
        if (host.includes('vimeo')) return 'Vimeo';
        if (host.includes('coursera')) return 'Coursera';
        if (host.includes('udemy')) return 'Udemy';
        return 'Web Video';
    }

    // --- Caption Selectors ---
    const CAPTION_SELECTORS = [
        '.ytp-caption-segment',
        '.player-timedtext-text-container',
        '.chat-line__message',
        '[data-purpose="video-transcript-cue-active"]',
        '.subtitles-container',
        '[aria-label*="caption"]',
        '.caption', '.subtitle', '.captions',
        '[class*="caption"]', '[class*="subtitle"]'
    ];

    function findCaptions() {
        for (const sel of CAPTION_SELECTORS) {
            const el = document.querySelector(sel);
            if (el && el.textContent.trim()) return el.textContent.trim();
        }
        const tracks = document.querySelectorAll('track[kind="subtitles"], track[kind="captions"]');
        for (const t of tracks) {
            if (t.track && t.track.activeCues && t.track.activeCues.length) {
                return t.track.activeCues[0].text;
            }
        }
        return '';
    }

    // --- Meeting Adapters ---
    // Meet and Teams only put live captions in the DOM once captions are
    // turned on in the call. Each caption block (one per speaker turn) keeps
    // growing and self-correcting, so adapters return one entry per block.
    // Selectors follow actively maintained caption extensions (TranscripTonic,
    // Live-Captions-Saver) and will need updating when these sites change.
    function meetIcon(name) {
        for (const el of document.querySelectorAll('.google-symbols')) {
            if (el.textContent.trim() === name) return el;
        }
        return null;
    }

    const MEETING_ADAPTERS = {
        'Google Meet': {
            captionsHint: 'Turn on captions (CC) in Meet to start signing',
            inCall: () => Boolean(meetIcon('call_end')),
            // Returns null until the CC button exists (e.g. still in the lobby).
            enableCaptions() {
                const off = meetIcon('closed_caption_off');
                if (off) {
                    (off.closest('button') || off).click();
                    return 'turned on';
                }
                return meetIcon('closed_caption') ? 'already on' : null;
            },
            segments() {
                const region = document.querySelector('div[role="region"][tabindex="0"]');
                if (!region) return [];
                // A caption text element holds the words directly and sits
                // right after the speaker-name element.
                const segments = [];
                const seen = new Set();
                const walker = document.createTreeWalker(region, NodeFilter.SHOW_TEXT);
                for (let node = walker.nextNode(); node; node = walker.nextNode()) {
                    const el = node.parentElement;
                    if (!node.nodeValue.trim() || seen.has(el)) continue;
                    seen.add(el);
                    const speakerEl = el.previousElementSibling;
                    if (!speakerEl || !speakerEl.textContent.trim()) continue;
                    if (el.closest('button, .google-symbols')) continue;
                    segments.push({ el, text: el.textContent });
                }
                return segments;
            }
        },
        'Microsoft Teams': {
            captionsHint: 'Turn on live captions: More → Language and speech → Show live captions',
            inCall: () => Boolean(document.querySelector(
                '#hangup-button, [data-tid="hangup-main-btn"], [data-tid="hangup-leave-button"], [data-tid="hangup-end-meeting-button"]'
            )),
            // Live captions sit behind the More menu; the overlay hint covers it.
            enableCaptions: () => 'manual',
            segments() {
                return Array.from(document.querySelectorAll('[data-tid="closed-caption-text"]'),
                    el => ({ el, text: el.textContent }));
            }
        }
    };

    const meetingAdapter = MEETING_ADAPTERS[detectPlatform()] || null;

    // Per caption element: how many of its words were already sent to the avatar.
    const captionProgress = new WeakMap();

    function readMeetingCaptions(flush) {
        const segments = meetingAdapter.segments();
        const now = Date.now();
        const newWords = [];
        let latest = null;
        let pending = false;

        for (const seg of segments) {
            const words = seg.text.trim().split(/\s+/).filter(Boolean);
            let progress = captionProgress.get(seg.el);
            if (!progress) {
                // Captions already on screen when the extension attaches are
                // history; only sign what is said from now on.
                progress = { text: '', sent: meetingCaptionsSeeded ? 0 : words.length, changedAt: now };
                captionProgress.set(seg.el, progress);
            }
            if (seg.text !== progress.text) {
                progress.text = seg.text;
                progress.changedAt = now;
            }
            // A correction can shorten the text; words already signed stay signed.
            progress.sent = Math.min(progress.sent, words.length);

            const settled = flush && now - progress.changedAt >= CAPTION_SETTLE_MS;
            const ready = settled ? words.length : words.length - 1;
            if (ready > progress.sent) {
                newWords.push(...words.slice(progress.sent, ready));
                progress.sent = ready;
            }
            if (progress.sent < words.length) pending = true;
            if (words.length) latest = seg;
        }
        meetingCaptionsSeeded = true;
        return { newWords, latest, pending };
    }

    // ----------------------------------------------------------------
    // Apply settings to the overlay. Called from both message handler
    // and storage.onChanged — two delivery paths for reliability.
    // ----------------------------------------------------------------
    function applySettings(s) {
        // Merge into local settings regardless of whether overlay exists
        Object.assign(settings, s);

        // Mirror enabled flag
        if ('enabled' in s) {
            enabled = s.enabled !== false;
        }

        // If overlay doesn't exist yet, just update state — creation
        // in scanForVideos() will use the updated settings object.
        if (!overlayEl) return;

        // -- Enable / Disable --
        if ('enabled' in s) {
            overlayEl.style.display = (s.enabled !== false) ? '' : 'none';
        }

        // -- Position --
        if ('position' in s && s.position) {
            // Clear any inline drag-applied left/top/right/bottom so the
            // CSS attribute rule takes effect cleanly
            overlayEl.style.left = '';
            overlayEl.style.top = '';
            overlayEl.style.right = '';
            overlayEl.style.bottom = '';
            overlayEl.setAttribute('data-pos', s.position);
        }

        // -- Size --
        if ('size' in s && s.size) {
            overlayEl.setAttribute('data-size', s.size);
        }

        // -- Avatar visibility --
        if ('showAvatar' in s) {
            const wrap = overlayEl.querySelector('.ss-avatar-wrap');
            if (wrap) wrap.style.display = (s.showAvatar !== false) ? '' : 'none';
        }

        // -- Captions --
        if ('captionSource' in s) {
            if (s.captionSource === 'off') {
                if (captionObserver) { captionObserver.disconnect(); captionObserver = null; }
            } else {
                startCaptionObserver();
            }
        }
    }

    // --- Overlay Creation ---
    function createOverlay() {
        if (overlayEl) return;

        overlayEl = document.createElement('div');
        overlayEl.id = 'glossia-overlay';
        overlayEl.innerHTML = `
      <div class="ss-header">
        <div class="ss-logo">
          <span class="ss-logo-dot"></span>
          <span class="ss-logo-text">Glossia</span>
        </div>
        <div class="ss-controls">
          <div class="ss-live-dot"></div>
          <button class="ss-minimize-btn" title="Minimize">−</button>
          <button class="ss-close-btn" title="Close">×</button>
        </div>
      </div>
      <div class="ss-body">
        <div class="ss-avatar-wrap">
                    <iframe class="ss-avatar-frame" id="ss-avatar-frame"
                        src="${AVATAR_HOST_URL}"
                        title="Sign language avatar" allow="autoplay"></iframe>
        </div>
        <div class="ss-info">
          <div class="ss-caption" id="ss-caption"></div>
          <div class="ss-sign-word" id="ss-sign-word">–</div>
          <div class="ss-conf-bar">
            <div class="ss-conf-fill" id="ss-conf-fill"></div>
          </div>
        </div>
      </div>
      <div class="ss-ticker" id="ss-ticker">
        <span id="ss-ticker-text">Waiting for speech…</span>
      </div>
    `;

        document.body.appendChild(overlayEl);
        overlayEl.querySelector('#ss-caption').textContent =
            meetingAdapter ? meetingAdapter.captionsHint : 'Detecting captions…';
        avatarFrame = overlayEl.querySelector('#ss-avatar-frame');
        avatarFrame.addEventListener('load', () => {
            avatarReady = false;
            console.log('[Glossia] Avatar iframe loaded; waiting for CWASA');
        });

        // Apply current settings immediately (position, size, avatar visibility)
        overlayEl.setAttribute('data-pos', settings.position || 'bottom-right');
        overlayEl.setAttribute('data-size', settings.size || 'medium');
        if (settings.showAvatar === false) {
            const wrap = overlayEl.querySelector('.ss-avatar-wrap');
            if (wrap) wrap.style.display = 'none';
        }
        if (settings.enabled === false) {
            overlayEl.style.display = 'none';
        }

        makeOverlayDraggable(overlayEl);
        overlayEl.querySelector('.ss-close-btn').addEventListener('click', () => {
            overlayEl.style.display = 'none';
            enabled = false;
        });
        overlayEl.querySelector('.ss-minimize-btn').addEventListener('click', () => {
            overlayEl.classList.toggle('minimized');
        });
    }

    function makeOverlayDraggable(el) {
        let dragging = false, startX, startY, origX, origY;
        const header = el.querySelector('.ss-header');
        header.addEventListener('mousedown', (e) => {
            dragging = true;
            startX = e.clientX; startY = e.clientY;
            const rect = el.getBoundingClientRect();
            origX = rect.left; origY = rect.top;
            el.style.transition = 'none';
            e.preventDefault();
        });
        document.addEventListener('mousemove', (e) => {
            if (!dragging) return;
            let nx = origX + (e.clientX - startX);
            let ny = origY + (e.clientY - startY);
            nx = Math.max(0, Math.min(window.innerWidth - el.offsetWidth, nx));
            ny = Math.max(0, Math.min(window.innerHeight - el.offsetHeight, ny));
            el.style.left = `${nx}px`;
            el.style.top = `${ny}px`;
            el.style.right = 'auto';
            el.style.bottom = 'auto';
        });
        document.addEventListener('mouseup', () => {
            dragging = false;
            el.style.transition = '';
        });
    }

    function updateOverlay(caption, sign) {
        if (!overlayEl || !enabled) return;
        const captionEl = document.getElementById('ss-caption');
        const wordEl = document.getElementById('ss-sign-word');
        const confEl = document.getElementById('ss-conf-fill');
        const tickerEl = document.getElementById('ss-ticker-text');

        // Meeting captions grow at the end, so show their newest part.
        const shown = meetingAdapter
            ? (caption.length > 50 ? '…' : '') + caption.slice(-50)
            : caption.slice(0, 50) + (caption.length > 50 ? '…' : '');
        if (captionEl) captionEl.textContent = shown;
        if (wordEl) wordEl.textContent = sign.label;
        const conf = sign.matched ? 70 + Math.floor(Math.random() * 28) : 40 + Math.floor(Math.random() * 20);
        if (confEl) confEl.style.width = `${conf}%`;
        if (tickerEl) tickerEl.textContent = caption;
    }

    // PLAY_TEXT replaces whatever the avatar is signing (video captions show
    // whole lines); APPEND_TEXT queues new words after it (meeting captions).
    function sendToAvatar(type, text) {
        if (!text || !avatarFrame || !avatarFrame.contentWindow) return;
        if (!avatarReady) {
            if (type === 'PLAY_TEXT') pendingAvatarMessages = [];
            pendingAvatarMessages.push({ type, text });
            return;
        }

        console.log('[Glossia] Sending transcript to avatar:', type, text);
        avatarFrame.contentWindow.postMessage({ type, text }, AVATAR_HOST_ORIGIN);
    }

    window.addEventListener('message', (event) => {
        if (
            event.origin !== AVATAR_HOST_ORIGIN ||
            event.source !== avatarFrame?.contentWindow ||
            event.data?.type !== 'AVATAR_READY'
        ) return;

        avatarReady = true;
        console.log('[Glossia] Avatar renderer ready');
        const pending = pendingAvatarMessages;
        pendingAvatarMessages = [];
        for (const msg of pending) sendToAvatar(msg.type, msg.text);
    });

    function matchSign(caption) {
        const upper = caption.toUpperCase();
        for (const key of Object.keys(ASL_SHAPES)) {
            if (upper.includes(key)) return { label: key, shape: ASL_SHAPES[key], matched: true };
        }
        const fallback = caption.trim().split(/\s+/)[0].slice(0, 14).toUpperCase();
        return { label: fallback || '–', shape: 'open', matched: false };
    }

    function checkCaptions(flush) {
        if (settings.captionSource === 'off') return;

        if (!meetingAdapter) {
            const caption = findCaptions();
            if (caption && caption !== lastCaption) {
                lastCaption = caption;
                if (overlayEl && enabled) sendToAvatar('PLAY_TEXT', caption);
                updateOverlay(caption, matchSign(caption));
            }
            return;
        }

        const { newWords, latest, pending } = readMeetingCaptions(flush);
        if (newWords.length && overlayEl && enabled) {
            const chunk = newWords.join(' ');
            sendToAvatar('APPEND_TEXT', chunk);
            updateOverlay(latest.text.trim(), matchSign(chunk));
        }
        if (latest) lastCaption = latest.text.trim();

        // Nothing else may change on the page, so check back to send the
        // last word of each caption once it has settled.
        clearTimeout(captionFlushTimer);
        if (pending) captionFlushTimer = setTimeout(() => checkCaptions(true), CAPTION_SETTLE_MS);
    }

    function startCaptionObserver() {
        if (captionObserver) return;
        // Meeting pages mutate constantly; coalesce mutations into one check.
        captionObserver = new MutationObserver(() => {
            if (captionCheckTimer) return;
            captionCheckTimer = setTimeout(() => {
                captionCheckTimer = null;
                checkCaptions(false);
            }, CAPTION_CHECK_MS);
        });
        captionObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
    }

    function scanForVideos() {
        const videos = document.querySelectorAll('video');
        videoFound = videos.length > 0 && Array.from(videos).some(v => !v.paused || v.currentTime > 0);
        platform = detectPlatform();

        // In a call, cameras may all be off; being in the meeting is enough.
        if (meetingAdapter && meetingAdapter.inCall()) {
            videoFound = true;
            // Only once per page, so a user who turns captions off stays in control.
            if (!meetingCaptionsHandled && settings.captionSource !== 'off') {
                const result = meetingAdapter.enableCaptions();
                if (result) {
                    meetingCaptionsHandled = true;
                    console.log(`[Glossia] ${platform} captions: ${result}`);
                }
            }
        }

        if (videoFound) {
            if (!overlayEl) {
                createOverlay();
                startCaptionObserver();
            } else if (overlayEl.style.display === 'none' && enabled) {
                overlayEl.style.display = '';
            }
        }
    }

    // --- Message Listener (path 1: direct message from popup) ---
    chrome.runtime.onMessage.addListener((msg, _, sendResponse) => {
        if (msg.type === 'GET_STATUS') {
            sendResponse({ videoFound, currentCaption: lastCaption, platform });
            return true;
        }
        if (msg.type === 'SETTINGS_UPDATE') {
            applySettings(msg.settings);
            sendResponse({ ok: true });
            return true;
        }
        if (msg.type === 'TOGGLE') {
            applySettings({ enabled: msg.value });
        }
    });

    // --- Storage Watcher (path 2: fallback when tab messaging fails) ---
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== 'sync') return;
        const delta = {};
        for (const [key, { newValue }] of Object.entries(changes)) {
            delta[key] = newValue;
        }
        applySettings(delta);
    });

    // --- Boot ---
    chrome.storage.sync.get(null, (stored) => {
        if (stored && Object.keys(stored).length) {
            Object.assign(settings, stored);
            enabled = settings.enabled !== false;
        }
        scanForVideos();
    });

    setInterval(scanForVideos, 3000);
    startCaptionObserver();
})();
