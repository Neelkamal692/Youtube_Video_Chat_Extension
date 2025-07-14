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

const HF_APP_URL = "https://neel692-youtube-transcript-rag.hf.space"; 

// --- DOM Elements ---
const processBtn = document.getElementById('process-video-btn');
const statusContainer = document.getElementById('status-container');
const statusDiv = document.getElementById('status');
const statusText = document.getElementById('status-text');
const videoUrlInput = document.getElementById('video-url-input');
const processArea = document.getElementById('process-area');
const videoInteractSection = document.getElementById('video-interact-section');
const summarizeBtn = document.getElementById('summarize-btn');
const summaryViewer = document.getElementById('summary-viewer');
const questionInput = document.getElementById('question-input');
const askBtn = document.getElementById('ask-btn');
const answerViewer = document.getElementById('answer-viewer');
const outputViewer = document.getElementById('output-viewer');

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

async function handleProcessVideo() {
    const url = videoUrlInput.value;
    if (!url) {
        alert('No video URL found. Make sure you are on a YouTube video page.');
        return;
    }
    if (!gradioClient) {
        await connectToGradio();
        if (!gradioClient) return; // Connection failed
    }
    // UI updates for processing
    if (processArea) processArea.style.display = 'none';
    if (statusContainer) statusContainer.style.display = 'block';
    updateStatus('Processing video... This may take a moment.', 'loading');
    if (outputViewer) {
        outputViewer.style.display = 'none';
        outputViewer.innerHTML = '';
        outputViewer.classList.remove('visible');
    }
    try {
        const result = await gradioClient.predict('/process_video_url', [url]);
        const output = result.data[0];
        if (output?.error) {
            throw new Error(output.error);
        }
        // UI updates for success
        if (statusContainer) statusContainer.style.display = 'none';
        if (videoInteractSection) videoInteractSection.style.display = 'flex';
        videoProcessed = true;
        if (outputViewer) outputViewer.style.display = 'block';
        if (questionInput) questionInput.value = '';
    } catch (error) {
        console.error("Error processing video:", error);
        if (statusContainer) statusContainer.style.display = 'block';
        if (videoInteractSection) videoInteractSection.style.display = 'none';
        updateStatus(`Error: ${error.message}`, 'error');
        if (processArea) processArea.style.display = 'block';
        if (processBtn) processBtn.disabled = false;
        if (videoUrlInput) videoUrlInput.disabled = false;
        videoProcessed = false;
    }
}

// --- Streaming Helper ---
async function streamText(element, formattedText, delay = 20) {
    // Remove HTML tags for streaming, then re-apply after streaming
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = formattedText;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';
    let streamed = '';
    for (let i = 0; i < plainText.length; i++) {
        streamed += plainText[i];
        element.innerHTML = streamed;
        await new Promise(res => setTimeout(res, delay));
    }
    // After streaming, show formatted answer
    element.innerHTML = formattedText;
}

async function handleSummarize() {
    if (outputViewer) {
        outputViewer.style.display = 'block';
        outputViewer.classList.add('visible');
        outputViewer.innerHTML = '<span class="empty">Loading summary...</span>';
    }
    try {
        const result = await gradioClient.predict('/answer_question', ['Summarize the transcript']);
        const summary = result.data[0];
        const formatted = formatResponse(summary);
        if (outputViewer) await streamText(outputViewer, formatted);
    } catch (error) {
        if (outputViewer) outputViewer.innerHTML = `<span class="empty">An error occurred: ${error.message}</span>`;
    }
}

async function handleAsk() {
    const question = questionInput ? questionInput.value.trim() : '';
    if (!question) return;
    if (outputViewer) {
        outputViewer.style.display = 'block';
        outputViewer.classList.add('visible');
        outputViewer.innerHTML = '<span class="empty">Loading answer...</span>';
    }
    try {
        const result = await gradioClient.predict('/answer_question', [question]);
        const answer = result.data[0];
        const formatted = formatResponse(answer);
        if (outputViewer) await streamText(outputViewer, formatted);
    } catch (error) {
        if (outputViewer) outputViewer.innerHTML = `<span class="empty">An error occurred: ${error.message}</span>`;
    }
}

function loadInitialURL() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0];
        if (currentTab && currentTab.url && currentTab.url.includes("youtube.com/watch")) {
            videoUrlInput.value = currentTab.url;
            processBtn.disabled = false;
        } else {
            videoUrlInput.placeholder = "Not on a YouTube video page.";
            videoUrlInput.disabled = true;
            processBtn.disabled = true;
        }
    });
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    connectToGradio();
    loadInitialURL();
    if (processBtn) processBtn.addEventListener('click', handleProcessVideo);
    if (summarizeBtn) summarizeBtn.addEventListener('click', handleSummarize);
    if (askBtn) askBtn.addEventListener('click', handleAsk);
    if (questionInput) questionInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            handleAsk();
        }
    });
});