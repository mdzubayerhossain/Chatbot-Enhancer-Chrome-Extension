// Syntax highlighting for code blocks in chat messages
import { log } from '../../utils/logger.js';

// Selector mapping for different platforms
const PLATFORM_SELECTORS = {
  'chatgpt': {
    codeBlockSelector: '.markdown code',
    messageSelector: '[data-message-author-role]'
  },
  'mistral': {
    codeBlockSelector: '.chat-message code',
    messageSelector: '.chat-message'
  },
  // Add more platforms as needed
};

/**
 * Initialize the syntax highlighter for code blocks
 * @param {string} platform - The detected chatbot platform
 * @param {boolean} isReinitialization - Whether this is a re-initialization after DOM changes
 */
export function initSyntaxHighlighter(platform, isReinitialization = false) {
  try {
    const selectors = PLATFORM_SELECTORS[platform];
    if (!selectors) {
      log(`Syntax highlighter: Unsupported platform ${platform}`);
      return;
    }
    
    // Find all code blocks
    const codeBlocks = document.querySelectorAll(selectors.codeBlockSelector);
    
    // Apply syntax highlighting to code blocks that haven't been processed yet
    let highlightedCount = 0;
    
    codeBlocks.forEach(codeBlock => {
      // Skip if already processed
      if (codeBlock.classList.contains('prism-highlighted')) {
        return;
      }
      
      // Determine language (if specified)
      let language = 'text'; // Default
      
      // Check for language class on the code block or parent pre element
      const languageClass = Array.from(codeBlock.classList)
        .find(cls => cls.startsWith('language-'));
      
      if (languageClass) {
        language = languageClass.replace('language-', '');
      } else if (codeBlock.parentElement.tagName === 'PRE') {
        const preLanguageClass = Array.from(codeBlock.parentElement.classList)
          .find(cls => cls.startsWith('language-'));
        
        if (preLanguageClass) {
          language = preLanguageClass.replace('language-', '');
        }
      }
      
      // Apply highlighting if Prism is available
      if (window.Prism) {
        try {
          // Create a wrapper for the highlighted code
          const codeContent = codeBlock.textContent;
          
          // Handle code blocks with empty content
          if (!codeContent.trim()) {
            return;
          }
          
          // Apply highlighting
          const highlightedHTML = window.Prism.highlight(
            codeContent,
            window.Prism.languages[language] || window.Prism.languages.text,
            language
          );
          
          // Update the code block content
          codeBlock.innerHTML = highlightedHTML;
          
          // Mark as processed
          codeBlock.classList.add('prism-highlighted');
          highlightedCount++;
          
          // Add language indicator if it's not already there
          if (language !== 'text' && codeBlock.parentElement.tagName === 'PRE') {
            const languageIndicator = document.createElement('div');
            languageIndicator.className = 'code-language-indicator';
            languageIndicator.textContent = language;
            codeBlock.parentElement.appendChild(languageIndicator);
          }
          
          // Add copy button if it's not already there
          if (codeBlock.parentElement.tagName === 'PRE' && 
              !codeBlock.parentElement.querySelector('.code-copy-button')) {
            const copyButton = document.createElement('button');
            copyButton.className = 'code-copy-button';
            copyButton.textContent = 'Copy';
            copyButton.addEventListener('click', () => {
              navigator.clipboard.writeText(codeContent)
                .then(() => {
                  copyButton.textContent = 'Copied!';
                  setTimeout(() => { copyButton.textContent = 'Copy'; }, 2000);
                })
                .catch(err => {
                  log('Failed to copy code:', err);
                  copyButton.textContent = 'Failed';
                  setTimeout(() => { copyButton.textContent = 'Copy'; }, 2000);
                });
            });
            codeBlock.parentElement.appendChild(copyButton);
          }
        } catch (err) {
          log(`Syntax highlighting error for language ${language}:`, err.message);
        }
      } else {
        log('Prism library not loaded, syntax highlighting disabled');
      }
    });
    
    if (highlightedCount > 0 || isReinitialization) {
      log(`Syntax highlighter: Processed ${highlightedCount} new code blocks`);
    }
  } catch (error) {
    log('Syntax highlighter error:', error.message);
  }
}

// Handle theme changes to ensure proper highlighting
export function updateSyntaxHighlighterTheme(theme) {
  // Add theme-specific classes to the body to let Prism themes take effect
  document.body.classList.remove('prism-light', 'prism-dark', 'prism-high-contrast');
  
  switch (theme) {
    case 'dark':
      document.body.classList.add('prism-dark');
      break;
    case 'high-contrast':
      document.body.classList.add('prism-high-contrast');
      break;
    default: // light
      document.body.classList.add('prism-light');
      break;
  }
}