// Background service worker for Chrome extension
chrome.runtime.onInstalled.addListener(() => {
    console.log('Privacy Personality Analyzer installed');
    
    // Set up any background tasks or listeners here
    chrome.action.setBadgeText({ text: '🧠' });
    chrome.action.setBadgeBackgroundColor({ color: '#667eea' });
});

// Handle extension icon clicks
chrome.action.onClicked.addListener((tab) => {
    // This will open the popup automatically, no need for manual handling
    console.log('Extension clicked on tab:', tab.url);
});

// Listen for history changes to potentially trigger re-analysis
chrome.history.onVisited.addListener((historyItem) => {
    // Could implement real-time personality updates here
    console.log('New site visited:', historyItem.url);
});

// Store analysis results
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'saveAnalysis') {
        chrome.storage.local.set({ 
            lastAnalysis: request.data,
            timestamp: Date.now()
        });
        sendResponse({ success: true });
    }
    
    if (request.action === 'getStoredAnalysis') {
        chrome.storage.local.get(['lastAnalysis', 'timestamp'], (result) => {
            sendResponse(result);
        });
        return true; // Keep message channel open for async response
    }
});