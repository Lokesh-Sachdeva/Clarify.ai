// Background service worker for AI Text Analyzer extension

// Create context menu on installation
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'analyzeText',
        title: 'Ask AI about this text',
        contexts: ['selection']
    });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'analyzeText' && info.selectionText) {
        chrome.storage.local.set({
            selectedText: info.selectionText,
            pageUrl: tab.url,
            timestamp: Date.now()
        });
        chrome.action.openPopup();
    }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'openPopup') {
        chrome.storage.local.set({
            selectedText: request.selectedText,
            pageUrl: sender.tab.url,
            timestamp: Date.now()
        });
        chrome.action.openPopup();
    }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
    chrome.action.openPopup();
});
