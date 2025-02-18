// Theme Manager for applying custom themes to chatbot interfaces
import { log } from '../../utils/logger.js';
import { updateSyntaxHighlighterTheme } from './syntaxHighlighter.js';

// Available themes
const AVAILABLE_THEMES = ['light', 'dark', 'high-contrast', 'custom'];

// Platform-specific selectors for theme application
const PLATFORM_SELECTORS = {
  'chatgpt': {
    mainContainer: '.overflow-hidden',
    messageContainer: '[data-message-author-role]',
    inputContainer: '.h-full form'
  },
  'mistral': {
    mainContainer: '.app-container',
    messageContainer: '.chat-message',
    inputContainer: '.chat-input'
  },
  // Add more platforms as needed
};

let currentTheme = 'light';
let themeStylesheet = null;

/**
 * Initialize theme manager
 * @param {string} platform - The detected chatbot platform
 * @param {string} initialTheme - The initial theme to apply
 */
export function initThemeManager(platform, initialTheme = 'light') {
  try {
    if (!PLATFORM_SELECTORS[platform]) {
      log(`Theme manager: Unsupported platform ${platform}`);
      return;
    }
    
    // Create theme control UI if it doesn't exist
    if (!document.querySelector('.theme-control')) {
      createThemeControl(platform);
    }
    
    // Apply initial theme
    applyTheme(platform, initialTheme);
    
    log(`Theme manager initialized with ${initialTheme} theme`);
  } catch (error) {
    log('Theme manager initialization error:', error.message);
  }
}

/**
 * Create theme control UI
 * @param {string} platform - The detected chatbot platform
 */
function createThemeControl(platform) {
  const selectors = PLATFORM_SELECTORS[platform];
  
  // Create theme control container
  const themeControl = document.createElement('div');
  themeControl.className = 'theme-control';
  
  // Create theme selector
  const themeSelector = document.createElement('select');
  themeSelector.className = 'theme-selector';
  
  AVAILABLE_THEMES.forEach(theme => {
    const option = document.createElement('option');
    option.value = theme;
    option.textContent = theme.charAt(0).toUpperCase() + theme.slice(1).replace('-', ' ');
    themeSelector.appendChild(option);
  });
  
  // Set current theme
  themeSelector.value = currentTheme;
  
  // Handle theme change
  themeSelector.addEventListener('change', () => {
    const newTheme = themeSelector.value;
    applyTheme(platform, newTheme);
    
    // Save theme preference
    chrome.runtime.sendMessage({ 
      type: 'SAVE_SETTINGS', 
      settings: { theme: newTheme }
    });
    
    // Notify other tabs about theme change
    chrome.runtime.sendMessage({ 
      type: 'APPLY_THEME', 
      theme: newTheme
    });
  });
  
  // Add selector to control container
  themeControl.appendChild(themeSelector);
  
  // Add theme control to page
  const container = document.querySelector(selectors.mainContainer);
  if (container) {
    container.appendChild(themeControl);
  } else {
    // Fallback to body if container not found
    document.body.appendChild(themeControl);
  }
}

/**
 * Apply theme to the chatbot interface
 * @param {string} platform - The detected chatbot platform
 * @param {string} theme - The theme to apply
 */
export function applyTheme(platform, theme) {
  try {
    currentTheme = theme;
    
    // Remove existing theme stylesheet if any
    if (themeStylesheet) {
      themeStylesheet.remove();
    }
    
    // Create new stylesheet
    themeStylesheet = document.createElement('link');
    themeStylesheet.rel = 'stylesheet';
    themeStylesheet.href = chrome.runtime.getURL(`themes/${theme}.css`);
    document.head.appendChild(themeStylesheet);
    
    // Update body class for theme
    document.body.classList.remove('theme-light', 'theme-dark', 'theme-high-contrast', 'theme-custom');
    document.body.classList.add(`theme-${theme}`);
    
    // Update syntax highlighter theme
    updateSyntaxHighlighterTheme(theme);
    
    log(`Applied theme: ${theme}`);
    
    // Update theme selector if it exists
    const themeSelector = document.querySelector('.theme-selector');
    if (themeSelector) {
      themeSelector.value = theme;
    }
  } catch (error) {
    log('Error applying theme:', error.message);
  }
}

/**
 * Get the current theme
 * @returns {string} The current theme
 */
export function getCurrentTheme() {
  return currentTheme;
}