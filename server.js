const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Rate limiting and usage tracking
const usageTracker = new Map();

// Middleware to check rate limits
function checkRateLimit(req, res, next) {
    const clientId = req.headers['x-client-id'] || req.ip;
    const today = new Date().toDateString();
    const key = `${clientId}-${today}`;
    
    const currentUsage = usageTracker.get(key) || 0;
    const maxRequests = 50; // Adjust based on your needs
    
    if (currentUsage >= maxRequests) {
        return res.status(429).json({
            error: 'Rate limit exceeded. Please try again tomorrow.'
        });
    }
    
    usageTracker.set(key, currentUsage + 1);
    next();
}

// Main analysis endpoint
app.post('/api/analyze', checkRateLimit, async (req, res) => {
    try {
        const { selectedText, question, pageUrl, pageContent } = req.body;
        
        if (!selectedText || !question) {
            return res.status(400).json({
                error: 'Selected text and question are required'
            });
        }
        
        // Prepare context for AI
        const context = buildContext(selectedText, pageUrl, pageContent);
        const prompt = buildPrompt(question, context);
        
        // Get AI response
        const response = await getAIResponse(prompt);
        
        res.json({
            answer: response,
            usage: {
                selectedTextLength: selectedText.length,
                questionLength: question.length,
                pageContentLength: pageContent ? pageContent.length : 0
            }
        });
        
    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({
            error: 'Failed to analyze text. Please try again.'
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Test API key endpoint
app.get('/api/test-key', async (req, res) => {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return res.status(400).json({ 
                error: 'No API key found. Please set GEMINI_API_KEY in your .env file.' 
            });
        }
        
        // Test with a simple prompt
        const testPrompt = "Hello, this is a test. Please respond with 'API key is working!'";
        const response = await getAIResponse(testPrompt);
        
        res.json({ 
            status: 'success', 
            message: 'API key is working!',
            response: response,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('API key test failed:', error);
        res.status(500).json({ 
            error: 'API key test failed', 
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Usage statistics endpoint
app.get('/api/usage/:clientId', (req, res) => {
    const { clientId } = req.params;
    const today = new Date().toDateString();
    const key = `${clientId}-${today}`;
    
    const usage = usageTracker.get(key) || 0;
    res.json({ usage, date: today });
});

function buildContext(selectedText, pageUrl, pageContent) {
    let context = `Selected Text: "${selectedText}"\n\n`;
    
    if (pageUrl) {
        context += `Page URL: ${pageUrl}\n\n`;
    }
    
    if (pageContent) {
        // Truncate page content to avoid token limits
        const truncatedContent = pageContent.substring(0, 5000);
        context += `Page Context: ${truncatedContent}\n\n`;
    }
    
    return context;
}

function buildPrompt(question, context) {
    return `You are an AI assistant that helps users understand and analyze text they've selected from web pages.

${context}

User Question: ${question}

Please provide a helpful, accurate, and concise answer based on the selected text and context provided. If the selected text doesn't contain enough information to answer the question, say so clearly. Keep your response focused and relevant to what the user is asking.

Answer:`;
}

async function getAIResponse(prompt) {
    try {
        // Try different model names that are available
        const modelNames = ["gemini-1.5-flash", "gemini-pro","gemini-1.5-pro"];
        
        for (const modelName of modelNames) {
            try {
                console.log(`Trying model: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });
                
                const result = await model.generateContent(prompt);
                const response = await result.response;
                
                console.log(`Successfully used model: ${modelName}`);
                return response.text();
            } catch (modelError) {
                console.log(`Model ${modelName} failed:`, modelError.message);
                continue;
            }
        }
        
        // If all models fail, throw error
        throw new Error('No available Gemini models found');
    } catch (error) {
        console.error('Gemini API error:', error);
        throw new Error('Failed to get AI response');
    }
}

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({
        error: 'Internal server error'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`AI Text Analyzer backend running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
