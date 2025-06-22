# YouTube Video Chat Extension

A Chrome extension that connects to a Hugging Face Gradio backend to process YouTube videos and provide AI-powered Q&A about video content.

> **Note:** This extension currently only works for YouTube videos with English transcripts.

## 🚀 Quick Start

### Prerequisites
- Node.js and npm installed
- A Hugging Face Gradio app with two endpoints:
  - `/process_video` - Processes YouTube video URLs
  - `/answer_question` - Answers questions about video content

### 1. Setup and Build
1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the extension:
   ```bash
   npm run build
   ```

3. Load the Extension:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select your `Youtube_Video_Chat_Extension` folder
   - The extension should appear in your extensions list

### 2. Configure Your Hugging Face App
Update the Hugging Face app URL in `popup.js`:
```javascript
const HF_APP_URL = "https://your-huggingface-app.hf.space";
```

### 3. Test on YouTube
1. Go to any YouTube video
2. Click the extension icon to open the chat popup
3. Enter the YouTube video URL
4. Click "Process Video" to extract transcript and prepare for Q&A
5. Ask questions about the video content!

## 🧪 Testing Your Extension

### Test Workflow
1. **Load Extension** → chrome://extensions/ → Load unpacked
2. **Go to YouTube** → Navigate to any video
3. **Open Popup** → Click extension icon
4. **Enter URL** → Paste YouTube video URL
5. **Process Video** → Click "Process Video" button
6. **Ask Questions** → Type questions about video content
7. **Get AI Answers** → Receive intelligent responses

### Test Questions to Try
1. "What is the main topic of this video?"
2. "Summarize the key points discussed."
3. "What are the main arguments presented?"
4. "What examples were given in the video?"
5. "What conclusions were reached?"

## 🔧 How It Works

### API-Driven Architecture
The extension uses a clean API-driven approach:

1. **Video Processing** - Sends YouTube URL to `/process_video` endpoint
2. **Transcript Extraction** - Backend handles transcript extraction and processing
3. **Q&A Interface** - Users can ask questions via `/answer_question` endpoint
4. **AI Responses** - Backend provides intelligent answers about video content

### Benefits of This Approach
- ✅ **No content scripts** - Cleaner, more reliable
- ✅ **Backend processing** - Handles complex transcript extraction
- ✅ **Scalable** - Easy to add features like summarization
- ✅ **Secure** - No frontend transcript manipulation
- ✅ **Cross-platform** - Works with any Hugging Face Gradio app

## 🐛 Troubleshooting

### Build Issues
1. **Missing dependencies**: Run `npm install`
2. **Webpack errors**: Check `webpack.config.js` and polyfills
3. **Module not found**: Ensure all polyfills are properly configured

### Runtime Issues
1. **CSP errors**: Extension is properly bundled with Webpack
2. **Network errors**: Check Hugging Face app URL and connectivity
3. **API errors**: Verify endpoint URLs and response format

### Extension Issues
1. **Extension not loading**: Check manifest.json and build output
2. **Popup not working**: Inspect popup for JavaScript errors
3. **Permission errors**: Ensure extension has proper permissions

## 📁 File Structure

```
Youtube_Video_Chat_Extension/
├── manifest.json          # Extension configuration
├── popup.html             # Extension popup interface
├── popup.js               # Popup functionality (API calls)
├── package.json           # Node.js dependencies
├── webpack.config.js      # Webpack configuration with polyfills
├── dist/                  # Built extension files
│   └── popup.js          # Bundled JavaScript
└── README.md             # This file
```

## 🚀 Features

- ✅ **API-driven architecture** (clean, scalable)
- ✅ **Hugging Face Gradio integration**
- ✅ **Webpack bundling** (with polyfills)
- ✅ **Modern JavaScript** (ES6+ features)
- ✅ **Error handling** (network, API, user errors)
- ✅ **User-friendly interface**
- ✅ **No content scripts** (simpler, more reliable)

## 🔧 Technical Details

### Dependencies
- `@gradio/client` - Official Hugging Face Gradio client
- Webpack polyfills for Node.js modules:
  - `stream`, `crypto`, `buffer`, `zlib`
  - `net`, `tls`, `vm`, `assert`, `util`

### Build Process
1. **Webpack bundling** - Combines all JavaScript
2. **Polyfill injection** - Adds browser-compatible Node.js modules
3. **Module replacement** - Strips `node:` prefixes
4. **Output generation** - Creates `dist/popup.js`

### API Endpoints
Your Hugging Face app should provide:
- `POST /process_video` - Accepts YouTube URL, returns transcript
- `POST /answer_question` - Accepts question, returns AI answer

## 🔮 Future Enhancements

- [ ] Transcript caching
- [ ] Multiple language support
- [ ] Video summarization
- [ ] Key points extraction
- [ ] Timestamp-based answers
- [ ] Export functionality
- [ ] Batch processing
- [ ] Custom AI models

## 📝 Notes

- Requires a running Hugging Face Gradio backend
- Backend handles all transcript extraction complexity
- Extension focuses on UI and API communication
- Webpack ensures compatibility across browsers
- Polyfills enable Node.js modules in browser environment

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify your Hugging Face app is running
3. Check browser console for error messages
4. Ensure all dependencies are installed
5. Verify Webpack build completed successfully