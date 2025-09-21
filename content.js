let selectedText = '';

// Listening for message from popup.hmtl
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getSelectedText') {
        sendResponse({ selectedText: selectedText });
    } else if (request.action === 'getPageContent') {
        sendResponse(getPageContent());
    }
});

document.addEventListener('mouseup', captureSelectedText);
document.addEventListener('keyup', captureSelectedText);
document.addEventListener('selectionchange', captureSelectedText);

function captureSelectedText() {
    try {
        const selection = window.getSelection();
        if (selection && selection.toString().trim()) {
            selectedText = selection.toString().trim();
            console.log('Text selected:', selectedText.substring(0, 50) + '...');

            try {
                chrome.storage.local.set({ 
                    selectedText: selectedText,
                    pageUrl: window.location.href,
                    timestamp: Date.now()
                }, () => {
                    if (chrome.runtime.lastError) {
                        console.error('Storage error:',chrome.runtime.lastError);
                    }
                });
            } catch (storageError) {
                console.error('Storage API error:',storageError);
            }
        } else {
            // for Clearing selected text in case of null value returned from selection 
            selectedText = '';
            try {
                chrome.storage.local.remove(['selectedText', 'pageUrl', 'timestamp'], () => {
                    if (chrome.runtime.lastError) {
                        console.error('Storage clear error:', chrome.runtime.lastError);
                    }
                });
            } catch (storageError) {
                console.error('Storage clear API error:', storageError);
            }
        }
    } catch (error) {
        console.error('Error capturing selected text:', error);
        selectedText = '';
    }
}

function getPageContent() {
    const contentSelectors = [
        'main',
        'article',
        '.content',
        '.main-content',
        '#content',
        '#main',
        '.post-content',
        '.entry-content'
    ];
    
    let content = '';
    // trying to find main content area from the selectors
    for (const selector of contentSelectors) {
        const element = document.querySelector(selector);
        if (element) {
            content = element.textContent || element.innerText;
            break;
        }
    }
    // fallback stratergy : take body text content 
    if (!content) {
        content = document.body.textContent || document.body.innerText;
    }

    return cleanTextContent(content);
}

function cleanTextContent(text) {
    if (!text) return '';
    
    return text
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
        .trim()
        .substring(0, 10000); 
}

// Context menu integration (for right click on the page) 
document.addEventListener('contextmenu', (event) => {
    try {
        const selection = window.getSelection();
        if (selection && selection.toString().trim()) {
            try {
                chrome.storage.local.set({ 
                    contextMenuText: selection.toString().trim(),
                    contextMenuUrl: window.location.href
                }, () => {
                    if (chrome.runtime.lastError) {
                        console.error('Context menu storage error:', chrome.runtime.lastError);
                    }
                });
            } catch (storageError) {
                console.error('Context menu storage API error:', storageError);
            }
        }
    } catch (error) {
        console.error('Context menu error:', error);
    }
});

// Keyboard shortcut (Ctrl+Shift+A) to open popup with selected text
document.addEventListener('keydown', (event) => {
    try {
        if (event.ctrlKey && event.shiftKey && event.key === 'A') {
            event.preventDefault();
            
            const selection = window.getSelection();
            if (selection && selection.toString().trim()) {
                selectedText = selection.toString().trim();
                
                // Store the selected text with error handling
                try {
                    chrome.storage.local.set({ 
                        selectedText: selectedText,
                        pageUrl: window.location.href,
                        timestamp: Date.now()
                    }, () => {
                        if (chrome.runtime.lastError) {
                            console.error('Keyboard shortcut storage error:', chrome.runtime.lastError);
                        }
                    });
                } catch (storageError) {
                    console.error('Keyboard shortcut storage API error:', storageError);
                }
                
                // Open the popup
                try {
                    chrome.runtime.sendMessage({ 
                        action: 'openPopup',
                        selectedText: selectedText
                    });
                } catch (messageError) {
                    console.error('Runtime message error:', messageError);
                }
            }
        }
    } catch (error) {
        console.error('Keyboard shortcut error:', error);
    }
});

// Load previously selected text when page loads (i dont quite understand it / not understood)
window.addEventListener('load', () => {
    chrome.storage.local.get(['selectedText', 'pageUrl'], (result) => {
        if (result.selectedText && result.pageUrl === window.location.href) {
            // Check if the selection is still recent (within 5 minutes)
            const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
            if (result.timestamp && result.timestamp > fiveMinutesAgo) {
                selectedText = result.selectedText;
            }
        }
    });
});
