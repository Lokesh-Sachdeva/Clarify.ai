# AI Text Analyzer Browser Extension - Documentation

## made using AI

A powerful browser extension that allows users to highlight text on any webpage and ask AI-powered questions about it. Built with modern web technologies and integrated with Google's Gemini AI.

## Features

- **Text Selection**: Highlight any text on a webpage
- **AI Analysis**: Ask questions about the selected text using Gemini AI
- **Context Awareness**: Includes page URL and content for better analysis
- **Modern UI**: Clean, Interactive interface
- **Multiple Access Methods**: 
  - Right-click context menu
  - Extension popup
  - Keyboard shortcut (Ctrl+Shift+A)  
- **Usage Tracking**: Monitor daily usage
- **Copy Responses**: Easy copy-to-clipboard functionality

## Tech Stack

### Frontend (Extension)
- **Manifest V3**: Modern Chrome extension architecture
- **HTML/CSS/JavaScript**: Vanilla web technologies
- **Chrome Extensions API**: For browser integration

### Backend (Optional but Recommended)
- **Node.js**: Server runtime
- **Express.js**: Web framework
- **Google Gemini AI**: AI analysis engine
- **CORS**: Cross-origin resource sharing

## Installation

### 1. Extension Setup

1. **Clone or download** this repository
2. **Open Chrome** and go to `chrome://extensions/`
3. **Enable Developer mode** (toggle in top right)
4. **Click "Load unpacked"** and select the extension folder
5. **Pin the extension** to your toolbar for easy access

### 2. Backend Setup 

If you want to use your own backend for API key management and rate limiting:

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` and add your Gemini API key:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

4. **Start the server**:
   ```bash
   npm start
   ```

5. **Update the extension** to point to your backend:
   - Open `popup.js`
   - Replace `https://your-backend-url.com/api/analyze` with `http://localhost:3000/api/analyze`



## Usage

### Method 1: Context Menu
1. **Highlight text** on any webpage
2. **Right-click** the selection
3. **Choose "Ask AI about this text"**
4. **Type your question** in the popup
5. **Click "Ask AI"** to get your answer

### Method 2: Extension Popup
1. **Highlight text** on any webpage
2. **Click the extension icon** in your toolbar
3. **Type your question** about the selected text
4. **Click "Ask AI"** to get your answer

### Method 3: Keyboard Shortcut
1. **Highlight text** on any webpage
2. **Press Ctrl+Shift+A** (Windows/Linux) or Cmd+Shift+A (Mac)
3. **Type your question** in the popup
4. **Click "Ask AI"** to get your answer

## API Key Setup

### Option 1: Use Your Own Backend (Recommended)
1. Get a Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Set up the backend as described above
3. Add your API key to the `.env` file

### Option 2: Direct API Integration (Not Recommended for Production)
1. Get a Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Modify `popup.js` to call Gemini API directly
3. **Warning**: This exposes your API key in the extension

## File Structure

```
ai-text-analyzer/
├── manifest.json          # Extension configuration
├── popup.html            # Extension popup interface
├── popup.css             # Popup styles
├── popup.js              # Popup functionality
├── content.js            # Content script for web pages
├── content.css           # Content script styles
├── background.js         # Background service worker
├── logo.png              # Extension icon
├── server.js             # Backend server
├── package.json          # Backend dependencies
├── env.example           # Environment variables template
└── README.md            
```

<!-- ## Configuration

### Extension Settings
- **Rate Limiting**: Configure in `server.js` (default: 50 requests/day)
- **Content Length**: Adjust in `content.js` (default: 10,000 characters)
- **UI Styling**: Modify `popup.css` for custom appearance

### Backend Settings
- **Port**: Change `PORT` in `.env` file
- **CORS**: Configure in `server.js` for production
- **Rate Limiting**: Adjust limits in `server.js`

## Development

### Extension Development
1. **Make changes** to extension files
2. **Reload extension** in `chrome://extensions/`
3. **Test changes** on any webpage

### Backend Development
1. **Install nodemon** for auto-reload:
   ```bash
   npm install -g nodemon
   ```
2. **Run in development mode**:
   ```bash
   npm run dev
   ``` -->

<!-- ## Troubleshooting

### Common Issues

1. **Extension not working**:
   - Check if Developer mode is enabled
   - Reload the extension
   - Check browser console for errors

2. **API calls failing**:
   - Verify your Gemini API key is correct
   - Check if backend is running (if using custom backend)
   - Check network connectivity

3. **Text selection not working**:
   - Ensure content script is loaded
   - Check if page has CSP restrictions
   - Try refreshing the page

### Debug Mode
1. **Open DevTools** for the extension popup
2. **Check Console** for error messages
3. **Inspect Network** tab for API calls

## Security Considerations

- **API Key Protection**: Use backend to protect your API keys
- **Rate Limiting**: Implement to prevent abuse
- **CORS**: Configure properly for production
- **Content Security Policy**: Respect website CSPs -->

<!-- ## Roadmap

- [ ] Support for multiple AI providers
- [ ] Response history and favorites
- [ ] Export functionality
- [ ] Mobile browser support
- [ ] Advanced text analysis features
- [ ] User authentication and personalization -->
