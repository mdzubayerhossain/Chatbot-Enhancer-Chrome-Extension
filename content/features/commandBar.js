// Quick Command Bar for frequent commands or queries
import { log } from '../../utils/logger.js';
import { getSettings } from '../../utils/storage.js';

// Platform-specific selectors
const PLATFORM_SELECTORS = {
  'chatgpt': {
    inputArea: 'textarea',
    submitButton: 'button[data-testid="send-button"]'
  },
  'mistral': {
    inputArea: '.chat-input textarea',
    submitButton: '.chat-input button[type="submit"]'
  },
  // Add more platforms as needed
};

// Default commands
const DEFAULT_COMMANDS = [
  { name: 'Explain', text: 'Explain this in simple terms: ' },
  { name: 'Summarize', text: 'Summarize this text: ' },
  { name: 'Translate', text: 'Translate this to English: ' },
  { name: 'Code', text: 'Write code to: ' },
  { name: 'Fix', text: 'Fix this code: ' }
];

let commands = [...DEFAULT_COMMANDS];
let commandBar = null;
let isCommandBarVisible = false;

/**
 * Initialize the command bar
 * @param {string} platform - The detected chatbot platform
 */
export async function initCommandBar(platform) {
  try {
    const selectors = PLATFORM_SELECTORS[platform];
    if (!selectors) {
      log(`Command bar: Unsupported platform ${platform}`);
      return;
    }
    
    // Get custom commands from storage
    const settings = await getSettings();
    if (settings.commands) {
      commands = settings.commands;
    }
    
    // Create command bar UI
    createCommandBarUI(platform, selectors);
    
    // Set up keyboard shortcut (Ctrl+Space) to toggle command bar
    document.addEventListener('keydown', (event) => {
      if (event.ctrlKey && event.code === 'Space') {
        event.preventDefault();
        toggleCommandBar();
      }
    });
    
    log('Command bar initialized');
  } catch (error) {
    log('Command bar initialization error:', error.message);
  }
}

/**
 * Create the command bar UI
 * @param {string} platform - The detected chatbot platform
 * @param {object} selectors - Platform-specific selectors
 */
function createCommandBarUI(platform, selectors) {
  // Create command bar container
  commandBar = document.createElement('div');
  commandBar.className = 'quick-command-bar';
  commandBar.style.display = 'none';
  
  // Create command bar header
  const header = document.createElement('div');
  header.className = 'command-bar-header';
  
  const title = document.createElement('h3');
  title.textContent = 'Quick Commands';
  
  const closeButton = document.createElement('button');
  closeButton.textContent = '×';
  closeButton.className = 'command-bar-close';
  closeButton.addEventListener('click', toggleCommandBar);
  
  header.appendChild(title);
  header.appendChild(closeButton);
  commandBar.appendChild(header);
  
  // Create commands container
  const commandsContainer = document.createElement('div');
  commandsContainer.className = 'commands-container';
  
  // Add commands
  commands.forEach(command => {
    const commandButton = document.createElement('button');
    commandButton.className = 'command-button';
    commandButton.textContent = command.name;
    commandButton.addEventListener('click', () => {
      executeCommand(command.text, selectors);
    });
    commandsContainer.appendChild(commandButton);
  });
  
  commandBar.appendChild(commandsContainer);
  
  // Add custom command input
  const customCommandContainer = document.createElement('div');
  customCommandContainer.className = 'custom-command-container';
  
  const customCommandInput = document.createElement('input');
  customCommandInput.type = 'text';
  customCommandInput.placeholder = 'Custom command name';
  customCommandInput.className = 'custom-command-name';
  
  const customCommandText = document.createElement('input');
  customCommandText.type = 'text';
  customCommandText.placeholder = 'Command text';
  customCommandText.className = 'custom-command-text';
  
  const addButton = document.createElement('button');
  addButton.textContent = 'Add';
  addButton.className = 'add-command-button';
  addButton.addEventListener('click', () => {
    const name = customCommandInput.value.trim();
    const text = customCommandText.value.trim();
    
    if (name && text) {
      addCustomCommand(name, text);
      customCommandInput.value = '';
      customCommandText.value = '';
    }
  });
  
  customCommandContainer.appendChild(customCommandInput);
  customCommandContainer.appendChild(customCommandText);
  customCommandContainer.appendChild(addButton);
  
  commandBar.appendChild(customCommandContainer);
  
  // Add command bar to page
  document.body.appendChild(commandBar);
  
  // Add command bar toggle button
  addCommandBarToggle(platform, selectors);
}

/**
 * Add command bar toggle button
 * @param {string} platform - The detected chatbot platform
 * @param {object} selectors - Platform-specific selectors
 */
function addCommandBarToggle(platform, selectors) {
  const inputArea = document.querySelector(selectors.inputArea);
  if (!inputArea || document.querySelector('.command-bar-toggle')) {
    return;
  }
  
  const toggleButton = document.createElement('button');
  toggleButton.className = 'command-bar-toggle';
  toggleButton.innerHTML = '⌘';
  toggleButton.title = 'Toggle Command Bar (Ctrl+Space)';
  toggleButton.addEventListener('click', toggleCommandBar);
  
  // Insert button at appropriate position based on platform
  if (platform === 'chatgpt') {
    const buttonParent = inputArea.parentElement.parentElement;
    buttonParent.appendChild(toggleButton);
  } else if (platform === 'mistral') {
    const buttonParent = inputArea.closest('.chat-input');
    buttonParent.appendChild(toggleButton);
  }
}

/**
 * Toggle command bar visibility
 */
function toggleCommandBar() {
  isCommandBarVisible = !isCommandBarVisible;
  commandBar.style.display = isCommandBarVisible ? 'block' : 'none';
  
  if (isCommandBarVisible) {
    // Position the command bar
    const inputArea = document.querySelector(
      PLATFORM_SELECTORS.chatgpt.inputArea || 
      PLATFORM_SELECTORS.mistral.inputArea
    );
    
    if (inputArea) {
      const rect = inputArea.getBoundingClientRect();
      commandBar.style.bottom = `${window.innerHeight - rect.top + 10}px`;
      commandBar.style.left = `${rect.left}px`;
    }
  }
}

/**
 * Execute a command
 * @param {string} commandText - The command text to insert
 * @param {object} selectors - Platform-specific selectors
 */
function executeCommand(commandText, selectors) {
  const inputArea = document.querySelector(selectors.inputArea);
  const submitButton = document.querySelector(selectors.submitButton);
  
  if (inputArea && submitButton) {
    // Insert command text
    inputArea.value = commandText;
    inputArea.focus();
    
    // Trigger input event to update UI
    const event = new Event('input', { bubbles: true });
    inputArea.dispatchEvent(event);
    
    // Close command bar
    toggleCommandBar();
  } else {
    log('Could not find input area or submit button');
  }
}

/**
 * Add a custom command
 * @param {string} name - The command name
 * @param {string} text - The command text
 */
async function addCustomCommand(name, text) {
  try {
    // Add to commands array
    commands.push({ name, text });
    
    // Update UI
    const commandsContainer = commandBar.querySelector('.commands-container');
    
    const commandButton = document.createElement('button');
    commandButton.className = 'command-button';
    commandButton.textContent = name;
    commandButton.addEventListener('click', () => {
      executeCommand(text, PLATFORM_SELECTORS.chatgpt || PLATFORM_SELECTORS.mistral);
    });
    
    commandsContainer.appendChild(commandButton);
    
    // Save to storage
    const settings = await getSettings();
    settings.commands = commands;
    
    chrome.runtime.sendMessage({
      type: 'SAVE_SETTINGS',
      settings
    }, (response) => {
      if (response && response.success) {
        log(`Added custom command: ${name}`);
      } else {
        log('Failed to save custom command');
      }
    });
  } catch (error) {
    log('Error adding custom command:', error.message);
  }
}