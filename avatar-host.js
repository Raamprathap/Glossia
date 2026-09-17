// ============================================================
// Glossia – Avatar relay (avatar-host.js)
// Meeting sites block http://localhost iframes (Teams via CSP frame-src,
// Meet/others via Chrome's Local Network Access check). Neither applies to
// chrome-extension:// frames, so content.js embeds this page and this page
// embeds the avatar server, passing messages in both directions.
// ============================================================

const AVATAR_ORIGIN = 'http://localhost:5000';
const avatarFrame = document.getElementById('avatar');
avatarFrame.src = `${AVATAR_ORIGIN}/avatar/avatarnew.html`;

window.addEventListener('message', (event) => {
    if (event.source === window.parent && window.parent !== window) {
        // content script -> avatar
        avatarFrame.contentWindow.postMessage(event.data, AVATAR_ORIGIN);
    } else if (event.source === avatarFrame.contentWindow && event.origin === AVATAR_ORIGIN) {
        // avatar -> content script (AVATAR_READY)
        window.parent.postMessage(event.data, '*');
    }
});
