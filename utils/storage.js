// Storage utility functions for the extension
import { log } from './logger.js';

/**
 * Get settings from storage
 * @returns {Promise<object>} The settings object
 */
export async function getSettings() {
  try {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (response) => {
        resolve(response || {});
      });
    });
  } catch (error) {
    log('Error getting settings:', error.message);
    return {};
  }
}

/**
 * Save settings to storage
 * @param {object} settings - The settings to save
 * @returns {Promise<boolean>} Whether the save was successful
 */
export async function saveSettings(settings) {
  try {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({
        type: 'SAVE_SETTINGS',
        settings
      }, (response) => {
        resolve(response && response.success);
      });
    });
  } catch (error) {
    log('Error saving settings:', error.message);
    return false;
  }
}

/**
 * Get snippets from storage
 * @returns {Promise<Array>} The snippets array
 */
export async function getSnippets() {
  try {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_SNIPPETS' }, (response) => {
        resolve(response || []);
      });
    });
  } catch (error) {
    log('Error getting snippets:', error.message);
    return [];
  }
}

/**
 * Save session to storage
 * @param {Array} content - The session content
 * @param {boolean} consentGiven - Whether user consent has been given
 * @returns {Promise<object>} The response object
 */
export async function saveSession(content, consentGiven) {
  try {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({
        type: 'SAVE_SESSION',
        content,
        consentGiven
      }, resolve);
    });
  } catch (error) {
    log('Error saving session:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get sessions from storage
 * @returns {Promise<Array>} The sessions array
 */
export async function getSessions() {
  try {
    return new Promise((resolve) => {
      chrome.storage.local.get('sessions', (data) => {
        resolve(data.sessions || []);
      });
    });
  } catch (error) {
    log('Error getting sessions:', error.message);
    return [];
  }
}

/**
 * Delete a session
 * @param {number} sessionId - The ID of the session to delete
 * @returns {Promise<boolean>} Whether the deletion was successful
 */
export async function deleteSession(sessionId) {
  try {
    const sessions = await getSessions();
    const filteredSessions = sessions.filter(session => session.id !== sessionId);
    
    return new Promise((resolve) => {
      chrome.storage.local.set({ sessions: filteredSessions }, () => {
        resolve(true);
      });
    });
  } catch (error) {
    log('Error deleting session:', error.message);
    return false;
  }
}