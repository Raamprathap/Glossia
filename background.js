// Glossia – Service Worker (background.js)

chrome.runtime.onInstalled.addListener((details) => {
  // Only set defaults on FIRST install, not every reload/update
  if (details.reason !== 'install') return;
  chrome.storage.sync.set({
    enabled: true,
    position: 'bottom-right',
    size: 'medium',
    showAvatar: true,
    captionSource: 'auto',
    language: 'ASL'
  });
  console.log('[Glossia] Extension installed, defaults written.');
});
