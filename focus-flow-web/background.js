// Enhanced Chrome Extension Background Script
class FocusFlowBackground {
    constructor() {
        this.allowedWebsites = [
            'google.com', 'notion.so', 'chrome://', 'chrome-extension://', 
            'asana.com', 'perplexity.ai', 'chatgpt.com', 'wikipedia.org', 
            'stackoverflow.com', 'github.com', 'khanacademy.org', 'claude.ai',
            'youtube.com/watch?v=0b0axfyJ4oo', 'gmail.com', 'calendar.google.com',
            'drive.google.com', 'docs.google.com', 'sheets.google.com', 'slides.google.com'
        ];
        this.taskSpecificWebsites = [];
        this.currentTask = '';
        this.savedBlockLinks = [];
        this.isFocusModeActive = false;
        this.focusStartTime = null;
        this.blockedSites = [];
        this.productivityStats = {
            totalFocusTime: 0,
            sitesBlocked: 0,
            focusSessions: 0,
            lastUpdated: new Date().toISOString()
        };
        
        this.init();
    }

    init() {
        this.loadState();
        this.setupEventListeners();
        this.setupAlarms();
        this.requestPermissions();
    }

    setupEventListeners() {
        // Extension installation
        chrome.runtime.onInstalled.addListener(({ reason }) => {
            if (reason === 'install') {
                this.handleInstall();
            } else if (reason === 'update') {
                this.handleUpdate();
            }
        });

        // Message handling
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true; // Keep message channel open for async response
        });

        // Tab updates
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete') {
                this.handleTabUpdate(tabId, tab);
            }
        });

        // Tab activation
        chrome.tabs.onActivated.addListener((activeInfo) => {
            this.handleTabActivation(activeInfo);
        });

        // Extension startup
        chrome.runtime.onStartup.addListener(() => {
            this.handleStartup();
        });
    }

    setupAlarms() {
        // Set up periodic tasks
        chrome.alarms.create('updateStats', { periodInMinutes: 5 });
        chrome.alarms.create('cleanupData', { periodInMinutes: 60 });

        chrome.alarms.onAlarm.addListener((alarm) => {
            if (alarm.name === 'updateStats') {
                this.updateProductivityStats();
            } else if (alarm.name === 'updateStats') {
                this.cleanupOldData();
            }
        });
    }

    requestPermissions() {
        // Request necessary permissions
        const permissions = [
            'tabs',
            'storage',
            'alarms',
            'notifications',
            'webNavigation'
        ];

        chrome.permissions.request({ permissions }, (granted) => {
            if (granted) {
                console.log('All permissions granted');
            } else {
                console.log('Some permissions were denied');
            }
        });
    }

    handleInstall() {
        // Open welcome page
        chrome.tabs.create({
            url: chrome.runtime.getURL('files/installed.html')
        });

        // Initialize default settings
        this.initializeDefaultSettings();
    }

    handleUpdate() {
        // Handle extension updates
        console.log('Focus Flow updated');
        this.showNotification('Focus Flow has been updated! 🚀', 'info');
    }

    handleStartup() {
        // Handle browser startup
        this.loadState();
        this.checkFocusModeStatus();
    }

    handleMessage(request, sender, sendResponse) {
        console.log('Background received message:', request);

        switch (request.type) {
            case 'getCurrentTask':
                this.handleGetCurrentTask(request, sendResponse);
                break;
            case 'getSavedLinks':
                this.handleGetSavedLinks(request, sendResponse);
                break;
            case 'sendData':
                this.handleSendData(request, sendResponse);
                break;
            case 'appendBlockedLink':
                this.handleAppendBlockedLink(request, sendResponse);
                break;
            case 'startFocusMode':
                this.handleStartFocusMode(request, sendResponse);
                break;
            case 'stopFocusMode':
                this.handleStopFocusMode(request, sendResponse);
                break;
            case 'getProductivityStats':
                this.handleGetProductivityStats(request, sendResponse);
                break;
            case 'updateSettings':
                this.handleUpdateSettings(request, sendResponse);
                break;
            default:
                sendResponse({ error: 'Unknown message type' });
        }
    }

    handleGetCurrentTask(request, sendResponse) {
        if (!this.savedBlockLinks.includes(request.data)) {
            this.savedBlockLinks.push(request.data);
            this.saveState();
        }
        sendResponse({ 
            currentTask: this.currentTask,
            focusModeActive: this.isFocusModeActive,
            focusStartTime: this.focusStartTime
        });
    }

    handleGetSavedLinks(request, sendResponse) {
        sendResponse({ 
            savedLinks: this.savedBlockLinks,
            taskSpecificWebsites: this.taskSpecificWebsites
        });
    }

    handleSendData(request, sendResponse) {
        try {
            // Parse and validate data
            const { receivedArray, taskGoal } = request.data;
            
            if (!receivedArray || !taskGoal) {
                throw new Error('Missing required data');
            }

            // Parse websites array
            this.taskSpecificWebsites = receivedArray
                .split(',')
                .map(website => website.trim().replace(/^"|"$/g, ''))
                .filter(website => website.length > 0);

            this.currentTask = taskGoal;
            this.isFocusModeActive = true;
            this.focusStartTime = new Date().toISOString();

            console.log('Focus mode activated:', {
                task: this.currentTask,
                websites: this.taskSpecificWebsites,
                startTime: this.focusStartTime
            });

            // Update stats
            this.productivityStats.focusSessions++;
            this.updateProductivityStats();

            // Save state
            this.saveState();

            // Show notification
            this.showNotification('Focus mode activated! 🎯', 'success');

            sendResponse({ success: true, message: 'Focus mode activated' });

        } catch (error) {
            console.error('Error handling sendData:', error);
            sendResponse({ error: error.message });
        }
    }

    handleAppendBlockedLink(request, sendResponse) {
        try {
            const { website } = request.data;
            if (website && !this.savedBlockLinks.includes(website)) {
                this.savedBlockLinks.push(website);
                this.saveState();
                sendResponse({ success: true, message: 'Website added to allowed list' });
            } else {
                sendResponse({ success: false, message: 'Website already in list' });
            }
        } catch (error) {
            sendResponse({ error: error.message });
        }
    }

    handleStartFocusMode(request, sendResponse) {
        this.isFocusModeActive = true;
        this.focusStartTime = new Date().toISOString();
        this.saveState();
        this.showNotification('Focus mode started! 🚀', 'success');
        sendResponse({ success: true });
    }

    handleStopFocusMode(request, sendResponse) {
        this.isFocusModeActive = false;
        this.focusStartTime = null;
        this.saveState();
        this.showNotification('Focus mode stopped', 'info');
        sendResponse({ success: true });
    }

    handleGetProductivityStats(request, sendResponse) {
        sendResponse({ stats: this.productivityStats });
    }

    handleUpdateSettings(request, sendResponse) {
        try {
            const { settings } = request.data;
            Object.assign(this, settings);
            this.saveState();
            sendResponse({ success: true });
        } catch (error) {
            sendResponse({ error: error.message });
        }
    }

    handleTabUpdate(tabId, tab) {
        if (!this.isFocusModeActive || !this.currentTask) {
            return;
        }

        console.log(`Tab updated: ${tab.title} - ${tab.url}`);

        const tabDetails = {
            tabTitle: tab.title,
            tabURL: tab.url,
            timestamp: new Date().toISOString()
        };

        // Check if website is allowed
        if (this.isWebsiteAllowed(tab.url)) {
            console.log("Website is allowed");
            return;
        }

        // Check if it's task-specific
        if (this.isTaskSpecificWebsite(tab.url)) {
            console.log("Website is task-specific");
            return;
        }

        // Check with AI API
        this.checkWebsiteRelevance(tabId, tabDetails);
    }

    handleTabActivation(activeInfo) {
        if (this.isFocusModeActive) {
            // Track tab switching for productivity analytics
            this.trackTabSwitch(activeInfo.tabId);
        }
    }

    isWebsiteAllowed(url) {
        return this.allowedWebsites.some(website => url.includes(website));
    }

    isTaskSpecificWebsite(url) {
        return this.taskSpecificWebsites.some(website => url.includes(website));
    }

    async checkWebsiteRelevance(tabId, tabDetails) {
        try {
            const response = await fetch('http://localhost:3000/api/check', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    titleTab: tabDetails.tabTitle,
                    URLTab: tabDetails.tabURL,
                    goalNeeded: this.currentTask,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('AI response:', data);

            if (data.relevant === false) {
                // Block the website
                this.blockWebsite(tabId, tabDetails);
            } else {
                console.log("AI determined website is relevant");
            }

        } catch (error) {
            console.error('Error checking website relevance:', error);
            // Default to blocking if API fails
            this.blockWebsite(tabId, tabDetails);
        }
    }

    blockWebsite(tabId, tabDetails) {
        console.log('Blocking website:', tabDetails.tabURL);
        
        // Update stats
        this.productivityStats.sitesBlocked++;
        this.blockedSites.push(tabDetails);
        
        // Redirect to blocked page
        const blockedUrl = chrome.runtime.getURL('files/blocked.html') + 
            '?website=' + encodeURIComponent(tabDetails.tabURL) +
            '&task=' + encodeURIComponent(this.currentTask);
        
        chrome.tabs.update(tabId, { url: blockedUrl });
        
        // Show notification
        this.showNotification('Distracting website blocked! 🚫', 'warning');
        
        // Save state
        this.saveState();
    }

    trackTabSwitch(tabId) {
        // Track tab switching for productivity analytics
        const now = new Date();
        if (this.focusStartTime) {
            const focusDuration = (now - new Date(this.focusStartTime)) / 1000 / 60; // minutes
            this.productivityStats.totalFocusTime = Math.round(focusDuration * 10) / 10;
        }
    }

    updateProductivityStats() {
        this.productivityStats.lastUpdated = new Date().toISOString();
        this.saveState();
    }

    cleanupOldData() {
        // Clean up old blocked sites data (keep last 100)
        if (this.blockedSites.length > 100) {
            this.blockedSites = this.blockedSites.slice(-100);
        }
        
        // Clean up old focus sessions (older than 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        this.saveState();
    }

    showNotification(message, type = 'info') {
        try {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: chrome.runtime.getURL('files/assets/images/monkey-face-icon.png'),
                title: 'Focus Flow',
                message: message
            });
        } catch (error) {
            console.log('Notification not supported:', error);
        }
    }

    initializeDefaultSettings() {
        const defaultSettings = {
            notificationsEnabled: true,
            soundEnabled: true,
            autoBlockEnabled: true,
            focusModeDuration: 25,
            breakDuration: 5
        };

        chrome.storage.local.set({ settings: defaultSettings }, () => {
            console.log('Default settings initialized');
        });
    }

    loadState() {
        chrome.storage.local.get([
            'allowedWebsites', 'taskSpecificWebsites', 'currentTask', 
            'savedBlockLinks', 'isFocusModeActive', 'focusStartTime',
            'blockedSites', 'productivityStats'
        ], (result) => {
            if (result.allowedWebsites) this.allowedWebsites = result.allowedWebsites;
            if (result.taskSpecificWebsites) this.taskSpecificWebsites = result.taskSpecificWebsites;
            if (result.currentTask) this.currentTask = result.currentTask;
            if (result.savedBlockLinks) this.savedBlockLinks = result.savedBlockLinks;
            if (result.isFocusModeActive !== undefined) this.isFocusModeActive = result.isFocusModeActive;
            if (result.focusStartTime) this.focusStartTime = result.focusStartTime;
            if (result.blockedSites) this.blockedSites = result.blockedSites;
            if (result.productivityStats) this.productivityStats = result.productivityStats;
        });
    }

    saveState() {
        const state = {
            allowedWebsites: this.allowedWebsites,
            taskSpecificWebsites: this.taskSpecificWebsites,
            currentTask: this.currentTask,
            savedBlockLinks: this.savedBlockLinks,
            isFocusModeActive: this.isFocusModeActive,
            focusStartTime: this.focusStartTime,
            blockedSites: this.blockedSites,
            productivityStats: this.productivityStats
        };

        chrome.storage.local.set(state, () => {
            console.log('State saved');
        });
    }

    checkFocusModeStatus() {
        if (this.isFocusModeActive && this.focusStartTime) {
            const now = new Date();
            const focusDuration = (now - new Date(this.focusStartTime)) / 1000 / 60; // minutes
            
            // Auto-stop focus mode after 4 hours
            if (focusDuration > 240) {
                this.isFocusModeActive = false;
                this.focusStartTime = null;
                this.showNotification('Focus mode auto-stopped after 4 hours', 'info');
                this.saveState();
            }
        }
    }
}

// Initialize background script
const focusFlowBackground = new FocusFlowBackground();

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FocusFlowBackground;
}
