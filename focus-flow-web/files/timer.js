// Enhanced Timer and Focus Management System
class FocusTimer {
    constructor() {
        this.timer = null;
        this.timeLeft = 0;
        this.originalDuration = 0;
        this.breakDuration = 0;
        this.isPaused = false;
        this.isBreak = false;
        this.currentSession = 0;
        this.totalSessions = 0;
        this.lastStorageUpdate = 0;
        this.STORAGE_UPDATE_INTERVAL = 1000;
        this.notifications = [];
        this.soundEnabled = true;
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadSettings();
        this.checkExistingTimer();
        this.setupNotifications();
    }

    bindEvents() {
        // Timer controls
        const stopBtn = document.getElementById('stop-btn');
        const pauseBtn = document.getElementById('pause-btn');
        
        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stopTimer());
        }
        
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.togglePause());
        }

        // Listen for storage changes from other tabs
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.onChanged.addListener((changes, namespace) => {
                if (namespace === 'local' && changes.timerState) {
                    this.handleStorageChange(changes.timerState);
                }
            });
        }
    }

    loadSettings() {
        const settings = localStorage.getItem('focusFlowSettings');
        if (settings) {
            const parsed = JSON.parse(settings);
            this.soundEnabled = parsed.soundEnabled !== false;
            this.notifications = parsed.notifications || [];
        }
    }

    setupNotifications() {
        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }

    startFocusSession(duration, breakDuration, task) {
        this.originalDuration = duration * 60; // Convert to seconds
        this.breakDuration = breakDuration * 60;
        this.timeLeft = this.originalDuration;
        this.isBreak = false;
        this.isPaused = false;
        this.currentSession = 1;
        this.totalSessions = Math.ceil(this.originalDuration / (25 * 60)); // Estimate sessions

        // Save timer state
        this.saveTimerState(task);

        // Update UI
        this.updateTimerDisplay();
        this.updateProgressBar();
        this.showFocusTimer(task);

        // Start the timer
        this.startTimer();

        // Show notification
        this.showNotification('Focus session started! 🚀', 'success');
        
        // Update dashboard stats
        if (window.dashboardManager) {
            window.dashboardManager.stats.focusSessions++;
            window.dashboardManager.updateStats();
        }
    }

    startTimer() {
        if (!this.timer && !this.isPaused) {
            this.timer = setInterval(() => this.updateTimer(), 1000);
        }
    }

    togglePause() {
        const pauseBtn = document.getElementById('pause-btn');
        
        if (this.isPaused) {
            this.resumeTimer();
            if (pauseBtn) pauseBtn.textContent = '⏸️ Pause';
        } else {
            this.pauseTimer();
            if (pauseBtn) pauseBtn.textContent = '▶️ Resume';
        }
    }

    pauseTimer() {
        this.isPaused = true;
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        this.saveTimerState();
        this.showNotification('Timer paused', 'warning');
    }

    resumeTimer() {
        this.isPaused = false;
        this.startTimer();
        this.saveTimerState();
        this.showNotification('Timer resumed', 'success');
    }

    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        this.isPaused = false;
        this.isBreak = false;
        this.timeLeft = 0;
        
        // Clear timer state
        this.clearTimerState();
        
        // Show main dashboard
        this.showMainDashboard();
        
        // Show completion notification
        this.showNotification('Focus session completed! 🎉', 'success');
        
        // Update dashboard stats
        if (window.dashboardManager) {
            const minutesCompleted = Math.round((this.originalDuration - this.timeLeft) / 60);
            window.dashboardManager.updateFocusTime(minutesCompleted);
        }
    }

    updateTimer() {
        if (this.timeLeft <= 0) {
            this.handleTimerComplete();
            return;
        }

        this.timeLeft--;
        this.updateTimerDisplay();
        this.updateProgressBar();

        // Update storage periodically
        const now = Date.now();
        if (now - this.lastStorageUpdate >= this.STORAGE_UPDATE_INTERVAL) {
            this.lastStorageUpdate = now;
            this.saveTimerState();
        }

        // Check for break time
        if (this.timeLeft === 0 && !this.isBreak) {
            this.startBreak();
        }
    }

    handleTimerComplete() {
        if (this.isBreak) {
            this.completeBreak();
        } else {
            this.completeFocusSession();
        }
    }

    startBreak() {
        this.isBreak = true;
        this.timeLeft = this.breakDuration;
        this.originalDuration = this.breakDuration;
        
        // Update UI for break
        this.updateBreakUI();
        
        // Show break notification
        this.showNotification('Time for a break! ☕', 'info');
        
        // Play break sound
        this.playSound('break');
    }

    completeBreak() {
        this.isBreak = false;
        this.currentSession++;
        
        if (this.currentSession <= this.totalSessions) {
            // Start next focus session
            this.timeLeft = this.originalDuration;
            this.updateFocusUI();
            this.showNotification('Break complete! Back to work 💪', 'success');
        } else {
            // All sessions complete
            this.completeAllSessions();
        }
    }

    completeFocusSession() {
        this.showNotification('Focus session complete! Great job! 🎯', 'success');
        this.playSound('complete');
        
        // Update progress
        if (window.dashboardManager) {
            const minutesCompleted = Math.round(this.originalDuration / 60);
            window.dashboardManager.updateFocusTime(minutesCompleted);
        }
    }

    completeAllSessions() {
        this.showNotification('All focus sessions completed! 🏆', 'success');
        this.playSound('complete');
        this.stopTimer();
    }

    updateTimerDisplay() {
        const timerDisplay = document.getElementById('timer-display');
        if (!timerDisplay) return;

        const hours = Math.floor(this.timeLeft / 3600);
        const minutes = Math.floor((this.timeLeft % 3600) / 60);
        const seconds = this.timeLeft % 60;

        let display;
        if (hours > 0) {
            display = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        } else {
            display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }

        timerDisplay.textContent = display;

        // Add visual indication of paused state
        if (this.isPaused) {
            timerDisplay.classList.add('opacity-50');
        } else {
            timerDisplay.classList.remove('opacity-50');
        }
    }

    updateProgressBar() {
        const progressBar = document.getElementById('progress-bar');
        if (!progressBar) return;

        const totalTime = this.originalDuration;
        const elapsed = totalTime - this.timeLeft;
        const percentage = Math.min((elapsed / totalTime) * 100, 100);
        
        progressBar.style.width = `${percentage}%`;
    }

    updateBreakUI() {
        const focusTask = document.getElementById('focus-task-display');
        const timerTitle = document.querySelector('#focus-timer h1');
        
        if (focusTask) {
            focusTask.textContent = 'Break time! Take a moment to relax';
        }
        
        if (timerTitle) {
            timerTitle.textContent = '☕ Break Time!';
        }

        // Update buttons
        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) {
            pauseBtn.textContent = '⏸️ Pause Break';
        }
    }

    updateFocusUI() {
        const focusTask = document.getElementById('focus-task-display');
        const timerTitle = document.querySelector('#focus-timer h1');
        
        if (focusTask) {
            const savedTask = localStorage.getItem('currentFocusTask');
            if (savedTask) {
                const taskData = JSON.parse(savedTask);
                focusTask.textContent = `Task: ${taskData.task}`;
            }
        }
        
        if (timerTitle) {
            timerTitle.textContent = '🚀 You\'re in the zone!';
        }

        // Update buttons
        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) {
            pauseBtn.textContent = '⏸️ Pause';
        }
    }

    showFocusTimer(task) {
        // Hide main dashboard
        const mainDashboard = document.querySelector('.max-w-6xl');
        if (mainDashboard) {
            mainDashboard.classList.add('hidden');
        }

        // Show focus timer
        const focusTimer = document.getElementById('focus-timer');
        if (focusTimer) {
            focusTimer.classList.remove('hidden');
            
            // Update task display
            const taskDisplay = document.getElementById('focus-task-display');
            if (taskDisplay) {
                taskDisplay.textContent = `Task: ${task}`;
            }
        }
    }

    showMainDashboard() {
        // Hide focus timer
        const focusTimer = document.getElementById('focus-timer');
        if (focusTimer) {
            focusTimer.classList.add('hidden');
        }

        // Show main dashboard
        const mainDashboard = document.querySelector('.max-w-6xl');
        if (mainDashboard) {
            mainDashboard.classList.remove('hidden');
        }
    }

    saveTimerState(task = null) {
        const timerState = {
            taskName: task || this.getCurrentTask(),
            duration: this.originalDuration,
            breakDuration: this.breakDuration,
            timeRemaining: this.timeLeft,
            isRunning: !this.isPaused,
            isBreak: this.isBreak,
            currentSession: this.currentSession,
            totalSessions: this.totalSessions,
            lastUpdate: Date.now()
        };

        // Save to localStorage
        localStorage.setItem('focusFlowTimerState', JSON.stringify(timerState));

        // Save to Chrome storage if available
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.set({ timerState });
        }
    }

    clearTimerState() {
        localStorage.removeItem('focusFlowTimerState');
        
        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.remove('timerState');
        }
    }

    getCurrentTask() {
        const savedTask = localStorage.getItem('currentFocusTask');
        if (savedTask) {
            const taskData = JSON.parse(savedTask);
            return taskData.task;
        }
        return 'Focus Session';
    }

    checkExistingTimer() {
        const savedState = localStorage.getItem('focusFlowTimerState');
        if (savedState) {
            const state = JSON.parse(savedState);
            this.restoreTimerState(state);
        }
    }

    restoreTimerState(state) {
        this.originalDuration = state.duration;
        this.breakDuration = state.breakDuration;
        this.timeLeft = state.timeRemaining;
        this.isPaused = !state.isRunning;
        this.isBreak = state.isBreak || false;
        this.currentSession = state.currentSession || 1;
        this.totalSessions = state.totalSessions || 1;

        this.updateTimerDisplay();
        this.updateProgressBar();

        if (state.isRunning && !this.isPaused) {
            this.startTimer();
        }

        if (this.isBreak) {
            this.updateBreakUI();
        } else {
            this.updateFocusUI();
        }
    }

    handleStorageChange(change) {
        if (change.newValue && !this.timer) {
            this.restoreTimerState(change.newValue);
        }
    }

    showNotification(message, type = 'success') {
        // Show in-app notification
        if (window.dashboardManager && window.dashboardManager.showNotification) {
            window.dashboardManager.showNotification(message, type);
        }

        // Show browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Focus Flow', {
                body: message,
                icon: './assets/images/monkey-face-icon.png'
            });
        }
    }

    playSound(type) {
        if (!this.soundEnabled) return;

        try {
            // Create audio context for sound generation
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            if (type === 'complete') {
                // Success sound
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
                oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.2);
            } else if (type === 'break') {
                // Break sound
                oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
                oscillator.frequency.setValueAtTime(400, audioContext.currentTime + 0.1);
            }

            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
            console.log('Sound playback not supported');
        }
    }

    // Public method to start timer from external sources
    startFocusTimer(duration, breakDuration) {
        const task = this.getCurrentTask();
        this.startFocusSession(duration, breakDuration, task);
    }
}

// Initialize timer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.focusTimer = new FocusTimer();
    
    // Make startFocusTimer globally available
    window.startFocusTimer = (duration, breakDuration) => {
        window.focusTimer.startFocusTimer(duration, breakDuration);
    };
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FocusTimer;
}
