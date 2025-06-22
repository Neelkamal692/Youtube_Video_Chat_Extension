import './popup.css';
import { Client } from "@gradio/client";

class TranscriptAPI {
    constructor() {
        // This is the base URL for the unofficial API endpoint.
        this.API_BASE_URL = "https://www.youtube.com/api/timedtext";
    }

    /**
     * Fetches the transcript for a given video ID using the unofficial API.
     * @param {string} videoId The ID of the YouTube video (e.g., 'dQw4w9WgXcQ').
     * @returns {Promise<string>} A promise that resolves with the formatted transcript text.
     */
    async fetchTranscript(videoId) {
        if (!videoId) {
            throw new Error("Video ID is required.");
        }

        console.log(`Attempting to fetch transcript for video ID: ${videoId} via API method...`);
        const apiUrl = `${this.API_BASE_URL}?v=${videoId}&lang=en`;

        try {
            // Make a direct web request to the API endpoint.
            // This is the call that YouTube often blocks.
            const response = await fetch(apiUrl);

            if (!response.ok) {
                // This will often be a 4xx error if the IP is blocked or rate-limited.
                throw new Error(`YouTube API returned an error: ${response.status} ${response.statusText}. Your IP may be blocked.`);
            }

            const xmlText = await response.text();
            
            // The API returns the transcript in an XML format, so we need to parse it.
            return this.parseXmlTranscript(xmlText);

        } catch (error) {
            console.error("Transcript API fetch failed:", error);
            throw new Error("The API call failed. This is likely due to YouTube blocking the request. Our DOM-scraping method is more reliable.");
        }
    }

    /**
     * Parses the XML data returned by the YouTube API into a clean string.
     * @param {string} xmlText The raw XML response from the API.
     * @returns {string} The formatted transcript text.
     */
    parseXmlTranscript(xmlText) {
        // We use the browser's built-in DOM parser to handle the XML.
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");
        
        const textNodes = xmlDoc.getElementsByTagName('text');
        
        if (textNodes.length === 0) {
            throw new Error("Transcript found, but it was empty. The video may only have auto-generated captions which need to be fetched differently.");
        }
        
        // Convert the HTML entities (like &#39; for apostrophe) into actual characters.
        const decodeHtmlEntities = (text) => {
            const textarea = document.createElement('textarea');
            textarea.innerHTML = text;
            return textarea.value;
        };

        // Format the transcript similar to our other method.
        const formattedTranscript = Array.from(textNodes).map(node => {
            const start = parseFloat(node.getAttribute('start')).toFixed(2);
            const text = decodeHtmlEntities(node.textContent);
            return `[${this.formatTime(start)}] ${text}`;
        }).join('\n');

        return formattedTranscript;
    }

    /**
     * Converts seconds into a MM:SS format.
     * @param {number} seconds The time in seconds.
     * @returns {string} The time in MM:SS format.
     */
    formatTime(seconds) {
        const date = new Date(0);
        date.setSeconds(seconds);
        return date.toISOString().substr(14, 5);
    }
}

// Example of how you would use this class in your extension:
/*
async function handleGetTranscript() {
    try {
        const videoId = new URL(window.location.href).searchParams.get('v');
        const api = new TranscriptAPI();
        const transcript = await api.fetchTranscript(videoId);
        console.log("SUCCESS:", transcript);
        // send this transcript to the popup
    } catch (error) {
        console.error("FAILURE:", error.message);
        // show this error in the popup
    }
}
*/

const HF_APP_URL = "https://your-huggingface-app.hf.space"; 

// --- DOM Elements ---
const processBtn = document.getElementById('process-video-btn');
const askBtn = document.getElementById('ask-question-btn');
const statusDiv = document.getElementById('status');
const statusText = document.getElementById('status-text');
const videoUrlInput = document.getElementById('video-url-input');
const questionInput = document.getElementById('question-input');
const answerDiv = document.getElementById('answer');
const chatArea = document.getElementById('chat-area');

// --- State ---
let gradioClient = null;
let videoProcessed = false;

// --- Helper Functions ---
function updateStatus(message, type = 'default') {
    statusText.textContent = message;
    statusDiv.className = `status ${type}`;
}

function formatResponse(text) {
    // Convert **bold** to <strong>
    let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Convert * bullet points to <ul><li>
    if (formattedText.includes('* ')) {
        const lines = formattedText.split('\n');
        const listItems = lines
            .filter(line => line.trim().startsWith('* '))
            .map(line => `<li>${line.trim().substring(2).trim()}</li>`)
            .join('');
        
        const otherContent = lines
            .filter(line => !line.trim().startsWith('* '))
            .join('<br>');

        formattedText = `${otherContent}<ul>${listItems}</ul>`;
    }

    return formattedText.trim();
}

async function connectToGradio() {
    if (gradioClient) return;
    try {
        updateStatus('Connecting to AI backend...', 'loading');
        gradioClient = await Client.connect(HF_APP_URL);
        updateStatus('Connected! Ready to process video.', 'success');
    } catch (error) {
        console.error("Gradio connection error:", error);
        updateStatus('Failed to connect to backend.', 'error');
        processBtn.disabled = true;
    }
}

// --- Event Handlers ---
async function handleProcessVideo(url) {
    if (!url) {
        updateStatus('Please enter a valid YouTube URL.', 'error');
        return;
    }

    if (!gradioClient) {
        await connectToGradio();
        if (!gradioClient) return; // Connection failed
    }

    updateStatus('Processing video... This may take a moment.', 'loading');
    processBtn.disabled = true;
    videoUrlInput.disabled = true;

    try {
        const result = await gradioClient.predict('/process_video', { video_url: url });
        
        if (result.data && result.data.error) {
            throw new Error(result.data.error);
        }

        const successMessage = result.data?.message || "Video processed successfully!";
        updateStatus(successMessage, 'success');
        videoProcessed = true;
        chatArea.classList.add('visible');
        processBtn.disabled = false;
        videoUrlInput.disabled = false;
        answerDiv.innerHTML = 'You can now ask questions about the video.';
        answerDiv.classList.remove('empty');

    } catch (error) {
        console.error("Error processing video:", error);
        updateStatus(`Error: ${error.message}`, 'error');
        processBtn.disabled = false;
        videoUrlInput.disabled = false;
        videoProcessed = false;
    }
}

async function handleAskQuestion() {
    const question = questionInput.value;
    if (!question) {
        answerDiv.innerHTML = 'Please enter a question.';
        return;
    }

    if (!videoProcessed) {
        answerDiv.innerHTML = 'You must process a video before asking questions.';
        return;
    }

    askBtn.disabled = true;
    askBtn.classList.add('btn-loading');
    answerDiv.innerHTML = 'Thinking...';

    try {
        const result = await gradioClient.predict('/answer_question', { question });
        
        if (result.data && result.data.error) {
            throw new Error(result.data.error);
        }

        const formattedAnswer = formatResponse(result.data.answer);
        answerDiv.innerHTML = formattedAnswer;
        answerDiv.classList.remove('empty');

    } catch (error) {
        console.error("Error asking question:", error);
        answerDiv.innerHTML = `An error occurred: ${error.message}`;
    } finally {
        askBtn.disabled = false;
        askBtn.classList.remove('btn-loading');
    }
}

function handleProcessCurrentVideo() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0];
        if (currentTab && currentTab.url && currentTab.url.includes('youtube.com/watch')) {
            videoUrlInput.value = currentTab.url;
            handleProcessVideo(currentTab.url);
        } else {
            updateStatus('Please navigate to a YouTube video page first.', 'error');
        }
    });
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Auto-connect on load
    connectToGradio();

    // Event listeners
    processBtn.addEventListener('click', () => handleProcessVideo(videoUrlInput.value));
    askBtn.addEventListener('click', handleAskQuestion);
    statusDiv.addEventListener('click', handleProcessCurrentVideo);

    questionInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            handleAskQuestion();
        }
    });
}); 