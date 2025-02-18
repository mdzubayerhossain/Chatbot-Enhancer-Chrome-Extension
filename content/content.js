// Main content script to initialize all features
import { initSyntaxHighlighter } from './features/syntaxHighlighter.js';
import { initClipboardManager } from './features/clipboardManager.js';
import { initThemeManager } from './features/themeManager.js';
import { initSessionRecorder } from './features/sessionRecorder.js';
import { initCommandBar } from './features/commandBar.js';
import { getSettings } from '../utils/storage.js';
import { detectChatbotPlatform, observeDOMChanges } from '../utils/domUtils.js';
import { log } from '../utils/logger.js';
import { checkConsent } from '../utils/consentManager.js';

// Initialize extension
async function initializeExtension() {
  try {
    // Detect which chatbot platform we're on
    const platform = detectChatbotPlatform();
    if (!platform) {
      log('Not on a supported chatbot platform');
      return;
    }
    
    log(`Initializing extension on ${platform}`);
    
    // Get user settings
    const settings = await getSettings();
    
    // Initialize features based on settings
    if (settings.syntaxHighlighting) {
      initSyntaxHighlighter(platform);
    }
    
    if (settings.clipboardEnabled) {
      initClipboardManager(platform);
    }
    
    // Theme is always initialized to handle theme changes
    initThemeManager(platform, settings.theme);
    
    if (settings.commandBarEnabled) {
      initCommandBar(platform);
    }
    
    // Session recorder requires explicit consent
    if (settings.sessionRecording.enabled) {
      const hasConsent = await checkConsent();
      if (hasConsent) {
        initSessionRecorder(platform);
      } else {
        log('Session recording disabled: user consent not given');
      }
    }
    
    // Set up mutation observer to handle dynamic content
    observeDOMChanges(platform, () => {
      // Re-apply features when DOM changes
      if (settings.syntaxHighlighting) {
        initSyntaxHighlighter(platform, true); // Pass true to indicate re-initialization
      }
    });
    
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.type === 'THEME_CHANGED') {
        initThemeManager(platform, request.theme);
        sendResponse({ success: true });
      }
    });
    
    log('Extension initialized successfully');
  } catch (error) {
    log('Error initializing extension:', error.message);
  }
}

// Initialize when the page is fully loaded
document.addEventListener('DOMContentLoaded', initializeExtension);

// Also try to initialize immediately in case DOM is already loaded
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  initializeExtension();
}