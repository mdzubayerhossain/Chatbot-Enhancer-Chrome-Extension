// DOM utility functions for the extension
import { log } from './logger.js';

/**
 * Detect the chatbot platform based on URL and DOM elements
 * @returns {string|null} The detected platform or null if not detected
 */
export function detectChatbotPlatform() {
  const url = window.location.href;
  
  if (url.includes('chat.openai.com')) {
    return 'chatgpt';
  } else if (url.includes('mistral.ai')) {
    return 'mistral';
  }
  
  // Fallback detection based on DOM elements
  if (document.querySelector('.markdown')) {
    return 'chatgpt';
  } else if (document.querySelector('.chat-message')) {
    return 'mistral';
  }
  
  return null;
}

/**
 * Set up mutation observer to track DOM changes
 * @param {string} platform - The detected chatbot platform
 * @param {Function} callback - The callback to run when DOM changes
 * @returns {MutationObserver} The mutation observer
 */
export function observeDOMChanges(platform, callback) {
  const targetNode = document.body;
  const config = { childList: true, subtree: true };
  
  // Set up observer with callback
  const observer = new MutationObserver((mutations) => {
    let shouldCallback = false;
    
    // Check if relevant elements were added
    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check for platform-specific elements
            if ((platform === 'chatgpt' && 
                 (node.classList.contains('markdown') || 
                  node.hasAttribute('data-message-author-role'))) ||
                (platform === 'mistral' && 
                 node.classList.contains('chat-message'))) {
              shouldCallback = true;
            }
          }
        });
      }
    });
    
    // Execute callback if relevant changes were found
    if (shouldCallback) {
      callback();
    }
  });
  
  // Start observing
  observer.observe(targetNode, config);
  
  return observer;
}

/**
 * Wait for an element to be added to the DOM
 * @param {string} selector - The CSS selector for the element
 * @param {number} timeout - Maximum time to wait in milliseconds
 * @returns {Promise<Element>} The element or null if timeout
 */
export function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkElement = () => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
      } else if (Date.now() - startTime >= timeout) {
        resolve(null);
      } else {
        requestAnimationFrame(checkElement);
      }
    };
    
    checkElement();
  });
}