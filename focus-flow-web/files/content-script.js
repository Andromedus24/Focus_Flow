// Focus Flow Content Script
// This script runs on every web page to provide productivity features

class FocusFlowContentScript {
    constructor() {
        this.isFocusModeActive = false;
        this.currentTask = '';
        this.productivityData = {
            timeOnPage: 0,
            scrollDepth: 0,
            clicks: 0,
            keyStrokes: 0,
            startTime: Date.now()
        };
        
        this.init();
    }

    init() {
        this.checkFocusModeStatus();
        this.setupEventListeners();
        this.startProductivityTracking();
        this.injectProductivityUI();
    }

    async checkFocusModeStatus() {
        try {
            const response = await chrome.runtime.sendMessage({
                type: 'getCurrentTask'
            });
            
            if (response.focusModeActive) {
                this.isFocusModeActive = true;
                this.currentTask = response.currentTask;
                this.showFocusModeIndicator();
                this.startFocusModeFeatures();
            }
        } catch (error) {
            console.log('Focus Flow: Could not check focus mode status');
        }
    }

    setupEventListeners() {
        // Track user interactions
        document.addEventListener('click', (e) => this.trackClick(e));
        document.addEventListener('keydown', (e) => this.trackKeyStroke(e));
        document.addEventListener('scroll', (e) => this.trackScroll(e));
        
        // Track page visibility changes
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
        
        // Track before unload
        window.addEventListener('beforeunload', () => this.handlePageUnload());
        
        // Listen for messages from background script
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
        });
    }

    trackClick(event) {
        this.productivityData.clicks++;
        
        // Track meaningful clicks (avoid tracking every single click)
        if (event.target.tagName === 'A' || event.target.tagName === 'BUTTON') {
            this.sendProductivityUpdate();
        }
    }

    trackKeyStroke(event) {
        this.productivityData.keyStrokes++;
        
        // Track meaningful keystrokes (avoid tracking every key press)
        if (event.key.length === 1 || event.key === 'Enter' || event.key === 'Backspace') {
            this.sendProductivityUpdate();
        }
    }

    trackScroll(event) {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercentage = (scrollTop / scrollHeight) * 100;
        
        if (scrollPercentage > this.productivityData.scrollDepth) {
            this.productivityData.scrollDepth = Math.round(scrollPercentage);
            this.sendProductivityUpdate();
        }
    }

    handleVisibilityChange() {
        if (document.hidden) {
            this.pauseProductivityTracking();
        } else {
            this.resumeProductivityTracking();
        }
    }

    handlePageUnload() {
        // Send final productivity data before page unload
        this.sendProductivityUpdate(true);
    }

    startProductivityTracking() {
        setInterval(() => {
            if (!document.hidden) {
                this.productivityData.timeOnPage += 1;
                
                // Send updates every 30 seconds
                if (this.productivityData.timeOnPage % 30 === 0) {
                    this.sendProductivityUpdate();
                }
            }
        }, 1000);
    }

    pauseProductivityTracking() {
        // Pause tracking when page is not visible
        console.log('Focus Flow: Productivity tracking paused');
    }

    resumeProductivityTracking() {
        // Resume tracking when page becomes visible
        console.log('Focus Flow: Productivity tracking resumed');
    }

    sendProductivityUpdate(isFinal = false) {
        const data = {
            type: 'productivityUpdate',
            data: {
                url: window.location.href,
                title: document.title,
                timestamp: new Date().toISOString(),
                productivityData: { ...this.productivityData },
                isFinal
            }
        };

        chrome.runtime.sendMessage(data).catch(error => {
            console.log('Focus Flow: Could not send productivity update');
        });
    }

    showFocusModeIndicator() {
        if (this.isFocusModeActive) {
            this.createFocusModeBanner();
            this.addProductivityReminders();
        }
    }

    createFocusModeBanner() {
        // Create a subtle banner to remind users they're in focus mode
        const banner = document.createElement('div');
        banner.id = 'focus-flow-banner';
        banner.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                color: white;
                padding: 8px 16px;
                text-align: center;
                font-family: 'Inter', sans-serif;
                font-size: 14px;
                font-weight: 500;
                z-index: 999999;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            ">
                <span>🎯</span>
                <span>Focus Mode Active: ${this.currentTask}</span>
                <button id="focus-flow-stop" style="
                    background: rgba(255,255,255,0.2);
                    border: 1px solid rgba(255,255,255,0.3);
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    margin-left: 16px;
                ">Stop Focus</button>
            </div>
        `;

        document.body.appendChild(banner);

        // Add event listener for stop button
        document.getElementById('focus-flow-stop').addEventListener('click', () => {
            this.stopFocusMode();
        });

        // Auto-hide banner after 5 seconds
        setTimeout(() => {
            if (banner.parentNode) {
                banner.style.opacity = '0.7';
                banner.style.transition = 'opacity 0.3s ease';
            }
        }, 5000);
    }

    addProductivityReminders() {
        // Add productivity tips and reminders
        const reminder = document.createElement('div');
        reminder.id = 'focus-flow-reminder';
        reminder.innerHTML = `
            <div style="
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: white;
                border: 2px solid #6366f1;
                border-radius: 12px;
                padding: 16px;
                box-shadow: 0 8px 25px rgba(0,0,0,0.1);
                font-family: 'Inter', sans-serif;
                font-size: 14px;
                max-width: 300px;
                z-index: 999998;
                display: none;
            ">
                <div style="font-weight: 600; margin-bottom: 8px; color: #6366f1;">
                    💡 Productivity Tip
                </div>
                <div style="color: #374151; line-height: 1.4;">
                    Take regular breaks every 25 minutes to maintain focus and productivity.
                </div>
                <button id="focus-flow-reminder-close" style="
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    background: none;
                    border: none;
                    font-size: 18px;
                    cursor: pointer;
                    color: #9ca3af;
                ">×</button>
            </div>
        `;

        document.body.appendChild(reminder);

        // Show reminder after 2 minutes
        setTimeout(() => {
            if (reminder.parentNode) {
                reminder.style.display = 'block';
            }
        }, 120000);

        // Close reminder button
        document.getElementById('focus-flow-reminder-close').addEventListener('click', () => {
            reminder.style.display = 'none';
        });
    }

    startFocusModeFeatures() {
        // Add focus-enhancing features
        this.addDistractionBlocking();
        this.addTimeTracking();
        this.addGoalReminders();
    }

    addDistractionBlocking() {
        // Block common distracting elements (optional)
        const distractingSelectors = [
            'iframe[src*="youtube"]',
            'iframe[src*="facebook"]',
            'iframe[src*="twitter"]',
            '.social-media-widget',
            '.news-feed'
        ];

        distractingSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                element.style.filter = 'blur(5px)';
                element.style.pointerEvents = 'none';
                element.title = 'Distracting content blocked by Focus Flow';
            });
        });
    }

    addTimeTracking() {
        // Add a subtle time tracker
        const timeTracker = document.createElement('div');
        timeTracker.id = 'focus-flow-time-tracker';
        timeTracker.innerHTML = `
            <div style="
                position: fixed;
                top: 60px;
                right: 20px;
                background: rgba(99, 102, 241, 0.9);
                color: white;
                padding: 8px 12px;
                border-radius: 20px;
                font-family: 'Inter', sans-serif;
                font-size: 12px;
                font-weight: 500;
                z-index: 999997;
                backdrop-filter: blur(10px);
            ">
                <span id="focus-flow-time">00:00</span>
            </div>
        `;

        document.body.appendChild(timeTracker);

        // Update time every second
        setInterval(() => {
            const timeElement = document.getElementById('focus-flow-time');
            if (timeElement) {
                const minutes = Math.floor(this.productivityData.timeOnPage / 60);
                const seconds = this.productivityData.timeOnPage % 60;
                timeElement.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            }
        }, 1000);
    }

    addGoalReminders() {
        // Add periodic goal reminders
        setInterval(() => {
            if (this.isFocusModeActive && this.currentTask) {
                this.showGoalReminder();
            }
        }, 300000); // Every 5 minutes
    }

    showGoalReminder() {
        const reminder = document.createElement('div');
        reminder.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                border: 2px solid #6366f1;
                border-radius: 16px;
                padding: 24px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.2);
                font-family: 'Inter', sans-serif;
                text-align: center;
                z-index: 999999;
                max-width: 400px;
            ">
                <div style="font-size: 48px; margin-bottom: 16px;">🎯</div>
                <div style="font-weight: 600; font-size: 18px; color: #374151; margin-bottom: 8px;">
                    Stay Focused!
                </div>
                <div style="color: #6b7280; line-height: 1.5; margin-bottom: 20px;">
                    Remember your goal: <strong>${this.currentTask}</strong>
                </div>
                <button id="focus-flow-reminder-ok" style="
                    background: #6366f1;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-weight: 500;
                    cursor: pointer;
                ">Got it!</button>
            </div>
        `;

        document.body.appendChild(reminder);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (reminder.parentNode) {
                reminder.remove();
            }
        }, 10000);

        // OK button
        document.getElementById('focus-flow-reminder-ok').addEventListener('click', () => {
            reminder.remove();
        });
    }

    stopFocusMode() {
        this.isFocusModeActive = false;
        
        // Remove all focus mode UI elements
        const elements = [
            'focus-flow-banner',
            'focus-flow-reminder',
            'focus-flow-time-tracker'
        ];
        
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element && element.parentNode) {
                element.remove();
            }
        });

        // Send message to background script
        chrome.runtime.sendMessage({
            type: 'stopFocusMode'
        });

        // Show completion message
        this.showCompletionMessage();
    }

    showCompletionMessage() {
        const message = document.createElement('div');
        message.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                border: 2px solid #10b981;
                border-radius: 16px;
                padding: 24px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.2);
                font-family: 'Inter', sans-serif;
                text-align: center;
                z-index: 999999;
                max-width: 400px;
            ">
                <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
                <div style="font-weight: 600; font-size: 18px; color: #374151; margin-bottom: 8px;">
                    Focus Session Complete!
                </div>
                <div style="color: #6b7280; line-height: 1.5;">
                    Great job staying focused! You've made progress on: <strong>${this.currentTask}</strong>
                </div>
            </div>
        `;

        document.body.appendChild(message);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, 5000);
    }

    handleMessage(request, sender, sendResponse) {
        switch (request.type) {
            case 'startFocusMode':
                this.startFocusMode(request.data);
                break;
            case 'stopFocusMode':
                this.stopFocusMode();
                break;
            case 'getProductivityData':
                sendResponse({ data: this.productivityData });
                break;
            default:
                console.log('Focus Flow: Unknown message type:', request.type);
        }
    }

    startFocusMode(data) {
        this.isFocusModeActive = true;
        this.currentTask = data.task || 'Focus Session';
        this.showFocusModeIndicator();
        this.startFocusModeFeatures();
    }

    injectProductivityUI() {
        // Inject productivity-enhancing UI elements
        this.addQuickActions();
    }

    addQuickActions() {
        // Add quick action buttons for productivity
        const quickActions = document.createElement('div');
        quickActions.id = 'focus-flow-quick-actions';
        quickActions.innerHTML = `
            <div style="
                position: fixed;
                bottom: 20px;
                left: 20px;
                display: flex;
                flex-direction: column;
                gap: 8px;
                z-index: 999996;
            ">
                <button id="focus-flow-quick-start" style="
                    background: #6366f1;
                    color: white;
                    border: none;
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 20px;
                    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
                    transition: all 0.2s ease;
                " title="Quick Start Focus Session">🚀</button>
                
                <button id="focus-flow-quick-task" style="
                    background: #10b981;
                    color: white;
                    border: none;
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    cursor: pointer;
                    font-size: 20px;
                    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
                    transition: all 0.2s ease;
                " title="Add Quick Task">📝</button>
            </div>
        `;

        document.body.appendChild(quickActions);

        // Add event listeners
        document.getElementById('focus-flow-quick-start').addEventListener('click', () => {
            this.quickStartFocus();
        });

        document.getElementById('focus-flow-quick-task').addEventListener('click', () => {
            this.addQuickTask();
        });
    }

    quickStartFocus() {
        chrome.runtime.sendMessage({
            type: 'startFocusMode',
            data: { task: 'Quick focus session' }
        });
    }

    addQuickTask() {
        const task = prompt('What task would you like to add?');
        if (task) {
            // Send task to background script
            chrome.runtime.sendMessage({
                type: 'addQuickTask',
                data: { task }
            });
        }
    }
}

// Initialize content script
const focusFlowContent = new FocusFlowContentScript();

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FocusFlowContentScript;
}
