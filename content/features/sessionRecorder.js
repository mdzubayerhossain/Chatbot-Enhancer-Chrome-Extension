// Session Recorder for revisiting past conversations
import { log } from '../../utils/logger.js';
import { checkConsent } from '../../utils/consentManager.js';

// Platform-specific selectors
const PLATFORM_SELECTORS = {
  'chatgpt': {
    chatContainer: '.chat-container',
    messages: '[data-message-author-role]',
    inputArea: 'textarea'
  },
  'mistral': {
    chatContainer: '.chat-container',
    messages: '.chat-message',
    inputArea: '.chat-input textarea'
  },
  // Add more platforms as needed
};

let isRecording = false;
let recordedSession = [];
let recordingIndicator = null;

/**
 * Initialize session recorder
 * @param {string} platform - The detected chatbot platform
 */
export async function initSessionRecorder(platform) {
  try {
    const selectors = PLATFORM_SELECTORS[platform];
    if (!selectors) {
      log(`Session recorder: Unsupported platform ${platform}`);
      return;
    }
    
    // Check for consent
    const hasConsent = await checkConsent();
    if (!hasConsent) {
      log('Session recording disabled: user consent not given');
      return;
    }
    
    // Create recording controls if they don't exist
    if (!document.querySelector('.recording-controls')) {
      createRecordingControls(platform, selectors);
    }
    
    // Set up message observer
    setupMessageObserver(platform, selectors);
    
    log('Session recorder initialized');
  } catch (error) {
    log('Session recorder initialization error:', error.message);
  }
}

/**
 * Create recording controls
 * @param {string} platform - The detected chatbot platform
 * @param {object} selectors - Platform-specific selectors
 */
function createRecordingControls(platform, selectors) {
  // Create controls container
  const controls = document.createElement('div');
  controls.className = 'recording-controls';
  
  // Create recording toggle button
  const toggleButton = document.createElement('button');
  toggleButton.className = 'recording-toggle';
  toggleButton.textContent = 'Start Recording';
  toggleButton.addEventListener('click', () => {
    toggleRecording(platform, selectors, toggleButton);
  });
  
  // Create recording indicator
  recordingIndicator = document.createElement('div');
  recordingIndicator.className = 'recording-indicator';
  recordingIndicator.textContent = '⚪ Not Recording';
  
  // Add elements to controls
  controls.appendChild(toggleButton);
  controls.appendChild(recordingIndicator);
  
  // Add controls to page
  const chatContainer = document.querySelector(selectors.chatContainer);
  if (chatContainer) {
    chatContainer.appendChild(controls);
  } else {
    // Fallback to body if container not found
    document.body.appendChild(controls);
  }
  
  // Create session listing UI
  createSessionListingUI(platform);
}

/**
 * Toggle recording state
 * @param {string} platform - The detected chatbot platform
 * @param {object} selectors - Platform-specific selectors
 * @param {HTMLElement} toggleButton - The recording toggle button
 */
async function toggleRecording(platform, selectors, toggleButton) {
  try {
    // If starting recording, confirm consent
    if (!isRecording) {
      const hasConsent = await checkConsent(true); // Force consent dialog
      if (!hasConsent) {
        return;
      }
      
      // Start recording
      isRecording = true;
      recordedSession = [];
      
      // Capture existing messages
      captureExistingMessages(platform, selectors);
      
      // Update UI
      toggleButton.textContent = 'Stop Recording';
      recordingIndicator.textContent = '🔴 Recording';
      recordingIndicator.classList.add('recording-active');
      
      log('Session recording started');
    } else {
      // Stop recording
      isRecording = false;
      
      // Save session
      await saveSession();
      
      // Update UI
      toggleButton.textContent = 'Start Recording';
      recordingIndicator.textContent = '⚪ Not Recording';
      recordingIndicator.classList.remove('recording-active');
      
      log('Session recording stopped');
    }
  } catch (error) {
    log('Error toggling recording:', error.message);
  }
}

/**
 * Capture existing messages in the chat
 * @param {string} platform - The detected chatbot platform
 * @param {object} selectors - Platform-specific selectors
 */
function captureExistingMessages(platform, selectors) {
  const messages = document.querySelectorAll(selectors.messages);
  
  messages.forEach(message => {
    let role, content;
    
    // Extract role and content based on platform
    if (platform === 'chatgpt') {
      role = message.getAttribute('data-message-author-role');
      content = message.querySelector('.markdown').innerHTML;
    } else if (platform === 'mistral') {
      role = message.classList.contains('user-message') ? 'user' : 'assistant';
      content = message.querySelector('.message-content').innerHTML;
    }
    
    // Add to recorded session
    if (role && content) {
      recordedSession.push({
        role,
        content,
        timestamp: new Date().toISOString()
      });
    }
  });
}

/**
 * Set up observer to capture new messages
 * @param {string} platform - The detected chatbot platform
 * @param {object} selectors - Platform-specific selectors
 */
function setupMessageObserver(platform, selectors) {
  // Create mutation observer
  const observer = new MutationObserver((mutations) => {
    if (!isRecording) return;
    
    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(node => {
          // Check if node is a message
          if (node.nodeType === Node.ELEMENT_NODE && 
              ((platform === 'chatgpt' && node.hasAttribute('data-message-author-role')) ||
               (platform === 'mistral' && node.classList.contains('chat-message')))) {
            
            let role, content;
            
            // Extract role and content based on platform
            if (platform === 'chatgpt') {
              role = node.getAttribute('data-message-author-role');
              content = node.querySelector('.markdown')?.innerHTML;
            } else if (platform === 'mistral') {
              role = node.classList.contains('user-message') ? 'user' : 'assistant';
              content = node.querySelector('.message-content')?.innerHTML;
            }
            
            // Add to recorded session
            if (role && content) {
              recordedSession.push({
                role,
                content,
                timestamp: new Date().toISOString()
              });
            }
          }
        });
      }
    });
  });
  
  // Start observing chat container
  const chatContainer = document.querySelector(selectors.chatContainer);
  if (chatContainer) {
    observer.observe(chatContainer, { childList: true, subtree: true });
  }
}

/**
 * Save recorded session
 */
async function saveSession() {
  try {
    if (recordedSession.length === 0) {
      log('No session data to save');
      return;
    }
    
    // Save session to storage
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({
        type: 'SAVE_SESSION',
        content: recordedSession,
        consentGiven: true
      }, resolve);
    });
    
    if (response.success) {
      log('Session saved successfully');
      showSaveConfirmation();
    } else {
      log('Failed to save session:', response.error);
    }
  } catch (error) {
    log('Error saving session:', error.message);
  }
}

/**
 * Show save confirmation message
 */
function showSaveConfirmation() {
  const confirmation = document.createElement('div');
  confirmation.className = 'session-save-confirmation';
  confirmation.textContent = 'Session saved successfully!';
  document.body.appendChild(confirmation);
  
  setTimeout(() => {
    confirmation.remove();
  }, 3000);
}

/**
 * Create session listing UI
 * @param {string} platform - The detected chatbot platform
 */
function createSessionListingUI(platform) {
  // Create sessions button in the popup
  const popupScript = `
    document.addEventListener('DOMContentLoaded', () => {
      const sessionsButton = document.createElement('button');
      sessionsButton.id = 'view-sessions-button';
      sessionsButton.textContent = 'View Recorded Sessions';
      sessionsButton.addEventListener('click', () => {
        chrome.tabs.create({ url: chrome.runtime.getURL('popup/sessions.html') });
      });
      
      document.body.appendChild(sessionsButton);
    });
  `;
  
  // Inject the script into popup
  chrome.runtime.sendMessage({
    type: 'INJECT_POPUP_SCRIPT',
    script: popupScript
  });
}