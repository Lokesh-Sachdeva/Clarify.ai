document.addEventListener('DOMContentLoaded', function() {
    const questionInput = document.getElementById('questionInput');
    const askButton = document.getElementById('askButton');
    const selectedTextContainer = document.getElementById('selectedTextContainer');
    const selectedText = document.getElementById('selectedText');
    const responseContainer = document.getElementById('responseContainer');
    const responseContent = document.getElementById('responseContent');
    const clearSelectionBtn = document.getElementById('clearSelection');
    const refreshSelectionBtn = document.getElementById('refreshSelection');
    const copyResponseBtn = document.getElementById('copyResponse');
    const usageCount = document.getElementById('usageCount');
    const customTextInput = document.getElementById('customTextInput');
    const textInputSection = document.querySelector('.text-input-section');

    let currentSelectedText = '';
    let currentPageUrl = '';

    // Initialize popup
    initializePopup();

    // Event listeners
    questionInput.addEventListener('input', updateAskButton);
    customTextInput.addEventListener('input', updateAskButton);
    askButton.addEventListener('click', handleAskQuestion);
    clearSelectionBtn.addEventListener('click', clearSelection);
    refreshSelectionBtn.addEventListener('click', refreshSelectedText);
    copyResponseBtn.addEventListener('click', copyResponse);

    async function initializePopup() {
        try {
            // Get selected text from current tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (tab) {
                currentPageUrl = tab.url;
                
                // Check if we can inject content script (only on web pages)
                if (tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
                    // First, try to inject content script to ensure it's loaded
                    try {
                        await chrome.scripting.executeScript({
                            target: { tabId: tab.id },
                            files: ['content.js']
                        });
                        console.log('Content script injected successfully');
                    } catch (injectionError) {
                        console.log('Content script injection failed:', injectionError);
                    }
                    
                    // Wait a moment for the script to initialize
                    await new Promise(resolve => setTimeout(resolve, 200));
                    
                    // Get selected text from content script
                    chrome.tabs.sendMessage(tab.id, { action: 'getSelectedText' }, (response) => {
                        if (chrome.runtime.lastError) {
                            console.log('Error getting selected text:', chrome.runtime.lastError.message);
                        } else if (response && response.selectedText) {
                            console.log('Selected text found:', response.selectedText.substring(0, 50) + '...');
                            setSelectedText(response.selectedText);
                        } else {
                            console.log('No selected text found');
                        }
                    });
                } else {
                    // Show message for non-web pages
                    const header = document.querySelector('.header h1');
                    if (header) {
                        header.textContent = 'AI Text Analyzer';
                        document.querySelector('.subtitle').textContent = 'Navigate to a webpage to analyze text';
                    }
                }
            }

            // Load usage count
            loadUsageCount();
        } catch (error) {
            console.error('Error initializing popup:', error);
        }
    }

    function setSelectedText(text) {
        if (text && text.trim()) {
            currentSelectedText = text.trim();
            selectedText.textContent = currentSelectedText;
            selectedTextContainer.style.display = 'block';
            updateAskButton();
            
            // Update placeholder to indicate selected text is being used
            questionInput.placeholder = `Ask a question about the selected text: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`;
            
            console.log('Selected text set in popup:', currentSelectedText.substring(0, 50) + '...');
        }
    }

    function clearSelection() {
        currentSelectedText = '';
        selectedTextContainer.style.display = 'none';
        responseContainer.style.display = 'none';
        customTextInput.value = '';
        textInputSection.style.display = 'none';
        updateAskButton();
    }

    async function refreshSelectedText() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (tab && tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
                chrome.tabs.sendMessage(tab.id, { action: 'getSelectedText' }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.log('Error refreshing selected text:', chrome.runtime.lastError.message);
                    } else if (response && response.selectedText) {
                        console.log('Refreshed selected text:', response.selectedText.substring(0, 50) + '...');
                        setSelectedText(response.selectedText);
                    } else {
                        console.log('No text selected on page');
                    }
                });
            }
        } catch (error) {
            console.error('Error refreshing selected text:', error);
        }
    }

    function updateAskButton() {
        const hasQuestion = questionInput.value.trim().length > 0;
        const hasSelectedText = currentSelectedText.length > 0;
        const hasCustomText = customTextInput.value.trim().length > 0;
        const hasText = hasSelectedText || hasCustomText;
        
        askButton.disabled = !hasQuestion || !hasText;
        
        // Show/hide custom text input if no selected text
        if (!hasSelectedText && hasQuestion) {
            textInputSection.style.display = 'block';
        } else {
            textInputSection.style.display = 'none';
        }
    }

    async function handleAskQuestion() {
        const question = questionInput.value.trim();
        const customText = customTextInput.value.trim();
        const textToAnalyze = currentSelectedText || customText;
        
        if (!question || !textToAnalyze) return;

        // Show loading state
        setLoadingState(true);

        try {
            // Get page content if needed
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            let pageContent = '';
            
            if (tab && tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
                try {
                    pageContent = await new Promise((resolve, reject) => {
                        chrome.tabs.sendMessage(tab.id, { action: 'getPageContent' }, (response) => {
                            if (chrome.runtime.lastError) {
                                console.log('Could not get page content:', chrome.runtime.lastError.message);
                                resolve('');
                            } else {
                                resolve(response || '');
                            }
                        });
                    });
                } catch (error) {
                    console.log('Error getting page content:', error);
                    pageContent = '';
                }
            }

            // Prepare request data
            const requestData = {
                selectedText: textToAnalyze,
                question: question,
                pageUrl: currentPageUrl,
                pageContent: pageContent || ''
            };

            // Send to backend (you'll need to set up your own backend)
            const response = await sendToBackend(requestData);
            
            // Display response
            displayResponse(response);
            
            // Update usage count
            incrementUsageCount();

        } catch (error) {
            console.error('Error asking question:', error);
            displayError('Failed to get response. Please try again.');
        } finally {
            setLoadingState(false);
        }
    }

    async function sendToBackend(data) {
        // Backend URL - change this to your deployed backend URL
        const backendUrl = 'http://localhost:3000/api/analyze';
        
        try {
            const response = await fetch(backendUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error('API request failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Backend request failed:', error);
            
            // Fallback to simulated response if backend is not available
            return new Promise((resolve) => {
                setTimeout(() => {
                    const textPreview = data.selectedText.length > 50 ? 
                        data.selectedText.substring(0, 50) + "..." : 
                        data.selectedText;
                    
                    resolve({
                        answer: `Here's my analysis of your question "${data.question}":\n\nThis is a simulated response. To get real AI analysis, please:\n\n1. Set up the backend server: npm install && npm start\n2. Configure your Gemini API key in the .env file\n3. See the README for detailed setup instructions.\n\nThe extension is working correctly - this is just a demo response until you connect the real AI backend.`
                    });
                }, 1000);
            });
        }
    }

    function displayResponse(response) {
        responseContent.textContent = response.answer;
        responseContainer.style.display = 'block';
        
        // Scroll to response
        responseContainer.scrollIntoView({ behavior: 'smooth' });
    }

    function displayError(message) {
        // Remove existing error messages
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        const inputContainer = document.querySelector('.input-container');
        inputContainer.appendChild(errorDiv);
    }

    function setLoadingState(loading) {
        const buttonText = askButton.querySelector('.button-text');
        const spinner = askButton.querySelector('.loading-spinner');
        
        if (loading) {
            buttonText.style.display = 'none';
            spinner.style.display = 'block';
            askButton.disabled = true;
        } else {
            buttonText.style.display = 'block';
            spinner.style.display = 'none';
            updateAskButton();
        }
    }

    async function copyResponse() {
        const textToCopy = responseContent.textContent;
        try {
            await navigator.clipboard.writeText(textToCopy);
            showCopySuccess();
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    }

    function showCopySuccess() {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = 'Response copied to clipboard!';
        
        const responseContainer = document.getElementById('responseContainer');
        responseContainer.appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.remove();
        }, 2000);
    }

    async function loadUsageCount() {
        const result = await chrome.storage.local.get(['usageCount', 'lastUsageDate']);
        const today = new Date().toDateString();
        
        if (result.lastUsageDate === today) {
            usageCount.textContent = result.usageCount || 0;
        } else {
            usageCount.textContent = 0;
        }
    }

    async function incrementUsageCount() {
        const result = await chrome.storage.local.get(['usageCount', 'lastUsageDate']);
        const today = new Date().toDateString();
        
        let count = 0;
        if (result.lastUsageDate === today) {
            count = (result.usageCount || 0) + 1;
        } else {
            count = 1;
        }
        
        await chrome.storage.local.set({
            usageCount: count,
            lastUsageDate: today
        });
        
        usageCount.textContent = count;
    }
});
