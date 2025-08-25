// Dashboard Enhancement Script
class DashboardManager {
    constructor() {
        this.stats = {
            totalFocusTime: 0,
            tasksCompleted: 0,
            focusSessions: 0,
            productivityScore: 85
        };
        this.currentFilter = 'all';
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadStats();
        this.setupFilterButtons();
        this.setupSettings();
    }

    bindEvents() {
        // Focus form submission
        const focusForm = document.getElementById('focus-form');
        if (focusForm) {
            focusForm.addEventListener('submit', (e) => this.handleFocusStart(e));
        }

        // Quick start button
        const quickStartBtn = document.getElementById('quick-start-btn');
        if (quickStartBtn) {
            quickStartBtn.addEventListener('click', () => this.quickStart());
        }

        // Settings button
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.openSettings());
        }

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFilter(e));
        });

        // Settings modal close
        const closeSettingsModal = document.getElementById('close-settings-modal');
        if (closeSettingsModal) {
            closeSettingsModal.addEventListener('click', () => this.closeSettings());
        }

        // Click outside modal to close
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });
    }

    handleFocusStart(e) {
        e.preventDefault();
        
        const taskInput = document.getElementById('currentTask');
        const durationSelect = document.getElementById('duration');
        const breakDurationSelect = document.getElementById('break-duration');
        
        if (!taskInput.value.trim()) {
            this.showNotification('Please enter a task description', 'warning');
            return;
        }

        const taskData = {
            task: taskInput.value.trim(),
            duration: parseInt(durationSelect.value),
            breakDuration: parseInt(breakDurationSelect.value),
            timestamp: new Date().toISOString()
        };

        // Store task data
        localStorage.setItem('currentFocusTask', JSON.stringify(taskData));
        
        // Update stats
        this.stats.focusSessions++;
        this.updateStats();
        
        // Show focus timer
        this.showFocusTimer(taskData);
        
        // Show success notification
        this.showNotification('Focus session started! 🚀', 'success');
        
        // Reset form
        taskInput.value = '';
    }

    quickStart() {
        const defaultTask = "Quick focus session";
        const taskData = {
            task: defaultTask,
            duration: 25,
            breakDuration: 5,
            timestamp: new Date().toISOString()
        };

        localStorage.setItem('currentFocusTask', JSON.stringify(taskData));
        this.stats.focusSessions++;
        this.updateStats();
        this.showFocusTimer(taskData);
        this.showNotification('Quick focus session started! ⚡', 'success');
    }

    showFocusTimer(taskData) {
        // Hide main dashboard
        const mainDashboard = document.querySelector('.max-w-6xl');
        if (mainDashboard) mainDashboard.classList.add('hidden');

        // Show focus timer
        const focusTimer = document.getElementById('focus-timer');
        if (focusTimer) {
            focusTimer.classList.remove('hidden');
            
            // Update task display
            const taskDisplay = document.getElementById('focus-task-display');
            if (taskDisplay) {
                taskDisplay.textContent = `Task: ${taskData.task}`;
            }

            // Start the timer (this would integrate with existing timer.js)
            if (window.startFocusTimer) {
                window.startFocusTimer(taskData.duration, taskData.breakDuration);
            }
        }
    }

    handleFilter(e) {
        const filterType = e.target.id.replace('filter-', '');
        this.currentFilter = filterType;
        
        // Update active filter button
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active', 'bg-indigo-100', 'text-indigo-700');
            btn.classList.add('bg-gray-100', 'text-gray-700');
        });
        
        e.target.classList.remove('bg-gray-100', 'text-gray-700');
        e.target.classList.add('active', 'bg-indigo-100', 'text-indigo-700');
        
        // Filter tasks
        this.filterTasks(filterType);
    }

    filterTasks(filterType) {
        const taskItems = document.querySelectorAll('#todo-list li');
        
        taskItems.forEach(item => {
            const isCompleted = item.classList.contains('completed');
            
            switch (filterType) {
                case 'all':
                    item.style.display = 'block';
                    break;
                case 'pending':
                    item.style.display = isCompleted ? 'none' : 'block';
                    break;
                case 'completed':
                    item.style.display = isCompleted ? 'block' : 'none';
                    break;
            }
        });
    }

    setupFilterButtons() {
        // Set initial active state
        const allFilterBtn = document.getElementById('filter-all');
        if (allFilterBtn) {
            allFilterBtn.classList.add('active', 'bg-indigo-100', 'text-indigo-700');
        }
    }

    openSettings() {
        const settingsModal = document.getElementById('settings-modal');
        if (settingsModal) {
            settingsModal.style.display = 'block';
        }
    }

    closeSettings() {
        const settingsModal = document.getElementById('settings-modal');
        if (settingsModal) {
            settingsModal.style.display = 'none';
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    loadStats() {
        // Load stats from localStorage
        const savedStats = localStorage.getItem('focusFlowStats');
        if (savedStats) {
            this.stats = { ...this.stats, ...JSON.parse(savedStats) };
        }
        
        this.updateStats();
    }

    updateStats() {
        // Update display
        document.getElementById('total-focus-time').textContent = `${this.stats.totalFocusTime}h`;
        document.getElementById('tasks-completed').textContent = this.stats.tasksCompleted;
        document.getElementById('focus-sessions').textContent = this.stats.focusSessions;
        document.getElementById('productivity-score').textContent = `${this.stats.productivityScore}%`;
        
        // Save to localStorage
        localStorage.setItem('focusFlowStats', JSON.stringify(this.stats));
    }

    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        if (!notification) return;

        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.add('show');

        // Auto-hide after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    // Method to update stats from external sources (e.g., timer completion)
    updateFocusTime(minutes) {
        this.stats.totalFocusTime += Math.round(minutes / 60 * 10) / 10;
        this.updateStats();
    }

    completeTask() {
        this.stats.tasksCompleted++;
        this.updateStats();
    }

    updateProductivityScore(score) {
        this.stats.productivityScore = Math.max(0, Math.min(100, score));
        this.updateStats();
    }
}

// Enhanced Todo functionality
class EnhancedTodoManager {
    constructor() {
        this.tasks = this.loadTasks();
        this.init();
    }

    init() {
        this.renderTasks();
        this.bindEvents();
    }

    bindEvents() {
        const addBtn = document.getElementById('add-todo-btn');
        const input = document.getElementById('todo-input');

        if (addBtn && input) {
            addBtn.addEventListener('click', () => this.addTask());
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.addTask();
            });
        }
    }

    addTask() {
        const input = document.getElementById('todo-input');
        const taskText = input.value.trim();
        
        if (!taskText) return;

        const task = {
            id: Date.now(),
            text: taskText,
            completed: false,
            createdAt: new Date().toISOString(),
            priority: 'medium'
        };

        this.tasks.push(task);
        this.saveTasks();
        this.renderTasks();
        
        input.value = '';
        
        // Update dashboard stats
        if (window.dashboardManager) {
            window.dashboardManager.stats.tasksCompleted++;
            window.dashboardManager.updateStats();
        }
    }

    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            this.saveTasks();
            this.renderTasks();
        }
    }

    deleteTask(taskId) {
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.saveTasks();
        this.renderTasks();
    }

    renderTasks() {
        const todoList = document.getElementById('todo-list');
        if (!todoList) return;

        todoList.innerHTML = '';

        this.tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `task-item p-4 bg-white rounded-xl border border-gray-200 flex items-center gap-3 ${task.completed ? 'completed' : ''}`;
            li.dataset.taskId = task.id;

            li.innerHTML = `
                <input type="checkbox" class="custom-checkbox" ${task.completed ? 'checked' : ''}>
                <span class="flex-1 text-gray-700">${task.text}</span>
                <span class="text-xs text-gray-500">${this.formatDate(task.createdAt)}</span>
                <button class="delete-btn" onclick="todoManager.deleteTask(${task.id})">Delete</button>
            `;

            // Add event listener for checkbox
            const checkbox = li.querySelector('.custom-checkbox');
            checkbox.addEventListener('change', () => this.toggleTask(task.id));

            todoList.appendChild(li);
        });
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'Today';
        if (diffDays === 2) return 'Yesterday';
        if (diffDays <= 7) return `${diffDays - 1} days ago`;
        return date.toLocaleDateString();
    }

    loadTasks() {
        const saved = localStorage.getItem('focusFlowTasks');
        return saved ? JSON.parse(saved) : [];
    }

    saveTasks() {
        localStorage.setItem('focusFlowTasks', JSON.stringify(this.tasks));
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize dashboard manager
    window.dashboardManager = new DashboardManager();
    
    // Initialize enhanced todo manager
    window.todoManager = new EnhancedTodoManager();
    
    // Add some sample data if none exists
    if (window.todoManager.tasks.length === 0) {
        const sampleTasks = [
            { id: 1, text: 'Complete project documentation', completed: false, createdAt: new Date().toISOString() },
            { id: 2, text: 'Review code changes', completed: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
            { id: 3, text: 'Plan next sprint', completed: false, createdAt: new Date().toISOString() }
        ];
        window.todoManager.tasks = sampleTasks;
        window.todoManager.saveTasks();
        window.todoManager.renderTasks();
    }
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DashboardManager, EnhancedTodoManager };
}
