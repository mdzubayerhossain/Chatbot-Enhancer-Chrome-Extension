// Initialize default settings on install or update
chrome.runtime.onInstalled.addListener(() => {
    const defaultSettings = {
        theme: 'light',
        syntaxHighlighting: true,
        clipboardEnabled: true,
        commandBarEnabled: true,
        sessionRecording: {
            enabled: false,
            autoDelete: true,
            retentionDays: 7
        },
        consentGiven: false
    };

    // Store default settings
    chrome.storage.sync.set({ settings: defaultSettings }, () => {
        console.log("Default settings saved.");
    });

    chrome.storage.local.set({ clipboardSnippets: [] }, () => {
        console.log("Clipboard snippets initialized.");
    });

    // Set up session cleanup alarm
    chrome.alarms.create('sessionCleanup', { periodInMinutes: 1440 }); // Runs every 24 hours
});

// Listen for alarms
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'sessionCleanup') {
        cleanupOldSessions();
    }
});

// Function to clean up old sessions based on retention policy
function cleanupOldSessions() {
    chrome.storage.sync.get('settings', (data) => {
        const settings = data.settings;

        if (settings?.sessionRecording?.autoDelete) {
            chrome.storage.local.get('sessions', (data) => {
                const sessions = data.sessions || [];
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - settings.sessionRecording.retentionDays);

                // Filter out old sessions based on retention policy
                const filteredSessions = sessions.filter(session =>
                    new Date(session.timestamp) >= cutoffDate
                );

                chrome.storage.local.set({ sessions: filteredSessions }, () => {
                    console.log(`Cleaned up ${sessions.length - filteredSessions.length} old sessions`);
                });
            });
        }
    });
}
