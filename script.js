// PrepGen - AI-Powered Learning Platform
// Main Application JavaScript

document.addEventListener('DOMContentLoaded', function() {
    
    // ============================================================================
    // CONSTANTS
    // ============================================================================
    
    // For local development:
    const API_BASE_URL = "http://127.0.0.1:8000";
    
    // For production deployment, replace with your Railway backend URL:
    // const API_BASE_URL = "https://your-railway-app.up.railway.app";
    
    
    // ============================================================================
    // DOM ELEMENT SELECTION
    // ============================================================================
    
    // Pages
    const loginPage = document.getElementById('login-page');
    const appLayout = document.getElementById('app-layout');
    const dashboardPage = document.getElementById('dashboard-page');
    const chatPage = document.getElementById('chat-page');
    const quizPage = document.getElementById('quiz-page');
    const analyticsPage = document.getElementById('analytics-page');
    const interactiveQuizPage = document.getElementById('interactive-quiz-page');
    const quizSummaryPage = document.getElementById('quiz-summary-page');
    
    // Sidebar & Navigation
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');
    const navLinks = document.querySelectorAll('.nav-link');
    const pageTitle = document.getElementById('page-title');
    const userName = document.getElementById('user-name');
    const userAvatar = document.getElementById('user-avatar');
    const userAvatarContainer = document.getElementById('user-avatar-container');
    const headerUserAvatar = document.getElementById('header-user-avatar');
    const headerUserAvatarContainer = document.getElementById('header-user-avatar-container');
    const logoutBtn = document.getElementById('logout-btn');
    
    // Header Buttons
    const timerBtn = document.getElementById('timer-btn');
    const themeToggle = document.getElementById('theme-toggle');
    
    // Login
    const googleLoginBtn = document.getElementById('google-login-btn');
    
    // Dashboard Elements
    const aiStatusIndicator = document.getElementById('ai-status-indicator');
    const aiStatusText = document.getElementById('ai-status-text');
    const uploadFileBtn = document.getElementById('upload-file-btn');
    const summarizeYoutubeBtn = document.getElementById('summarize-youtube-btn');
    const dailyTasksBtn = document.getElementById('daily-tasks-btn');
    const materialsContainer = document.getElementById('materials-container');
    const fileInput = document.getElementById('file-input');
    
    // Chat Elements
    const chatContextHeader = document.getElementById('chat-context-header');
    const chatContextName = document.getElementById('chat-context-name');
    const chatMessages = document.getElementById('chat-messages');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    
    // Quiz Page Elements
    const quizMaterialsContainer = document.getElementById('quiz-materials-container');
    
    // Interactive Quiz Elements
    const quizTitle = document.getElementById('quiz-title');
    const quizProgress = document.getElementById('quiz-progress');
    const quizQuestionText = document.getElementById('quiz-question-text');
    const quizOptionsForm = document.getElementById('quiz-options-form');
    const submitAnswerBtn = document.getElementById('submit-answer-btn');
    const nextQuestionBtn = document.getElementById('next-question-btn');
    const quitQuizBtn = document.getElementById('quit-quiz-btn');
    
    // Quiz Summary Elements
    const quizSummarySubtitle = document.getElementById('quiz-summary-subtitle');
    const quizFinalScore = document.getElementById('quiz-final-score');
    const backToDashboardBtn = document.getElementById('back-to-dashboard-btn');
    
    // Analytics Elements
    const quizChart = document.getElementById('quiz-chart');
    
    // Modals
    const timerModal = document.getElementById('timer-modal');
    const closeTimerModal = document.getElementById('close-timer-modal');
    const minimizeTimerBtn = document.getElementById('minimize-timer-btn');
    const timerDisplay = document.getElementById('timer-display');
    const startTimerBtn = document.getElementById('start-timer-btn');
    const resetTimerBtn = document.getElementById('reset-timer-btn');
    
    // Floating Timer Widget
    const floatingTimer = document.getElementById('floating-timer');
    const floatingTimerDisplay = document.getElementById('floating-timer-display');
    const floatingPauseBtn = document.getElementById('floating-pause-btn');
    const expandTimerBtn = document.getElementById('expand-timer-btn');
    
    const tasksModal = document.getElementById('tasks-modal');
    const closeTasksModal = document.getElementById('close-tasks-modal');
    const addTaskForm = document.getElementById('add-task-form');
    const newTaskInput = document.getElementById('new-task-input');
    const taskList = document.getElementById('task-list');
    const congratsMessage = document.getElementById('congrats-message');
    
    const answerFeedbackModal = document.getElementById('answer-feedback-modal');
    const closeFeedbackModal = document.getElementById('close-feedback-modal');
    const feedbackIconContainer = document.getElementById('feedback-icon-container');
    const feedbackIcon = document.getElementById('feedback-icon');
    const feedbackTitle = document.getElementById('feedback-title');
    const feedbackExplanation = document.getElementById('feedback-explanation');
    
    // YouTube Modal Elements
    const youtubeModal = document.getElementById('youtube-modal');
    const closeYoutubeModal = document.getElementById('close-youtube-modal');
    const cancelYoutubeBtn = document.getElementById('cancel-youtube-btn');
    const youtubeForm = document.getElementById('youtube-form');
    const youtubeUrlInput = document.getElementById('youtube-url-input');
    const youtubeLoading = document.getElementById('youtube-loading');
    const submitYoutubeBtn = document.getElementById('submit-youtube-btn');
    
    // Floating Tasks Widget Elements
    const floatingTasksWidget = document.getElementById('floating-tasks-widget');
    const tasksWidgetBody = document.getElementById('tasks-widget-body');
    const tasksWidgetMinimized = document.getElementById('tasks-widget-minimized');
    const minimizeTasksWidget = document.getElementById('minimize-tasks-widget');
    const expandTasksWidget = document.getElementById('expand-tasks-widget');
    const closeTasksWidget = document.getElementById('close-tasks-widget');
    const floatingTaskForm = document.getElementById('floating-task-form');
    const floatingTaskInput = document.getElementById('floating-task-input');
    const floatingTaskList = document.getElementById('floating-task-list');
    
    
    // ============================================================================
    // STATE VARIABLES
    // ============================================================================
    
    let activeChatDocument = {
        id: null,
        filename: null
    };
    
    let currentQuizState = {
        quizData: [],
        currentQuestionIndex: 0,
        score: 0,
        contentId: null,
        filename: null
    };
    
    let tasks = [];
    let isTasksWidgetMinimized = false;
    
    let timerInterval = null;
    let timeLeft = 25 * 60; // 25 minutes in seconds
    let defaultTimerDuration = 25 * 60; // Store the default/selected duration
    let isTimerRunning = false;
    let isTimerMinimized = false;
    
    let quizChartInstance = null;
    
    // Track AI service availability
    let isAIServiceOnline = false;
    
    
    // ============================================================================
    // API HELPER FUNCTIONS
    // ============================================================================
    
    /**
     * Generic API fetch helper with authentication
     * @param {string} endpoint - API endpoint (relative to base URL)
     * @param {object} options - Fetch options
     * @returns {Promise<any>} - Response data or null on error
     */
    async function fetchAPI(endpoint, options = {}) {
        const accessToken = localStorage.getItem('access_token');
        
        if (!accessToken) {
            showLoginPage();
            return null;
        }
        
        // Set default headers
        const headers = {
            'Authorization': `Bearer ${accessToken}`,
            ...options.headers
        };
        
        // Only set Content-Type if body is not FormData
        if (!(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers
            });
            
            // Handle 401 Unauthorized - token expired or invalid
            if (response.status === 401) {
                localStorage.removeItem('access_token');
                showLoginPage();
                showNotification('Session expired. Please login again.', 'error');
                return null;
            }
            
            // Check if response is ok (status in the range 200-299)
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'An error occurred' }));
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }
            
            // Handle 204 No Content (empty response body)
            if (response.status === 204) {
                return { success: true };
            }
            
            // Parse and return JSON response
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            showNotification(error.message || 'An error occurred', 'error');
            return null;
        }
    }
    
    
    // ============================================================================
    // PAGE VISIBILITY FUNCTIONS
    // ============================================================================
    
    /**
     * Set up Google login button click handler
     * This needs to be called whenever the login page is shown
     * to ensure the button works after logout
     */
    function setupGoogleLoginButton() {
        if (googleLoginBtn) {
            // Remove any existing listeners by cloning the button
            const newGoogleLoginBtn = googleLoginBtn.cloneNode(true);
            googleLoginBtn.parentNode.replaceChild(newGoogleLoginBtn, googleLoginBtn);
            
            // Update reference to the new button
            const updatedGoogleLoginBtn = document.getElementById('google-login-btn');
            
            // Add fresh click listener
            if (updatedGoogleLoginBtn) {
                updatedGoogleLoginBtn.addEventListener('click', function() {
                    window.location.href = `${API_BASE_URL}/auth/google/login`;
                });
            }
        }
    }
    
    /**
     * Show the login page and hide the main app
     */
    function showLoginPage() {
        loginPage.classList.remove('hidden');
        appLayout.classList.add('hidden');
        
        // Set up Google login button (reattach listener in case it was removed)
        setupGoogleLoginButton();
    }
    
    /**
     * Show the main app and hide the login page
     */
    function showDashboard() {
        loginPage.classList.add('hidden');
        appLayout.classList.remove('hidden');
        navigateTo('dashboard');
    }
    
    /**
     * Navigate to a specific page within the app
     * @param {string} pageName - Name of the page to navigate to
     */
    function navigateTo(pageName) {
        // Hide all pages
        const pages = document.querySelectorAll('.page');
        pages.forEach(page => page.classList.remove('active'));
        
        // Remove active state from all nav links
        navLinks.forEach(link => {
            link.classList.remove('bg-indigo-100', 'dark:bg-gray-700', 'text-indigo-600', 'dark:text-indigo-400');
        });
        
        // Show the requested page and update header
        let targetPage, title;
        
        switch(pageName) {
            case 'dashboard':
                targetPage = dashboardPage;
                title = 'Dashboard';
                loadDashboardData();
                break;
            case 'chat':
                targetPage = chatPage;
                title = 'AI Chat';
                break;
            case 'quiz':
                targetPage = quizPage;
                title = 'Take Quiz';
                loadQuizMaterials();
                break;
            case 'analytics':
                targetPage = analyticsPage;
                title = 'Analytics';
                loadAnalytics();
                break;
            case 'interactive-quiz':
                targetPage = interactiveQuizPage;
                title = 'Quiz';
                break;
            case 'quiz-summary':
                targetPage = quizSummaryPage;
                title = 'Quiz Results';
                break;
            default:
                targetPage = dashboardPage;
                title = 'Dashboard';
        }
        
        if (targetPage) {
            targetPage.classList.add('active');
        }
        
        pageTitle.textContent = title;
        
        // Show/hide floating tasks widget based on page
        if (pageName === 'dashboard' && floatingTasksWidget) {
            // Don't auto-show, let user open it via button
            // But ensure it's available to show if already open
        } else if (floatingTasksWidget) {
            // Hide widget on other pages
            floatingTasksWidget.classList.add('hidden');
        }
        
        // Highlight active nav link
        const activeLink = document.querySelector(`[data-page="${pageName}"]`);
        if (activeLink) {
            activeLink.classList.add('bg-indigo-100', 'dark:bg-gray-700', 'text-indigo-600', 'dark:text-indigo-400');
        }
    }
    
    /**
     * Display a notification to the user
     * @param {string} message - Notification message
     * @param {string} type - Type of notification (success, error, info)
     */
    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg z-50 flex items-center gap-3 transition-all duration-300 transform translate-x-0`;
        
        // Set color based on type
        if (type === 'success') {
            notification.className += ' bg-green-500 text-white';
        } else if (type === 'error') {
            notification.className += ' bg-red-500 text-white';
        } else {
            notification.className += ' bg-blue-500 text-white';
        }
        
        notification.innerHTML = `
            <i data-lucide="${type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : 'info'}" class="w-5 h-5"></i>
            <span class="font-medium">${message}</span>
        `;
        
        document.body.appendChild(notification);
        lucide.createIcons();
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    
    // ============================================================================
    // PLACEHOLDER FUNCTIONS (To be implemented in subsequent parts)
    // ============================================================================
    
    function loadDashboardData() {
        // Check AI status once on initial load
        checkAIServiceStatus();
        fetchAndDisplayContent();
        
        // Removed periodic health checks - now checks only when AI features are used
    }
    
    /**
     * Check AI service status
     */
    async function checkAIServiceStatus() {
        try {
            const response = await fetch(`${API_BASE_URL}/health`);
            
            if (!response.ok) {
                throw new Error(`Health check failed with status ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.ai_service_status === 'online') {
                isAIServiceOnline = true;
                if (aiStatusIndicator) {
                    aiStatusIndicator.className = 'w-3 h-3 rounded-full bg-green-500';
                }
                if (aiStatusText) {
                    aiStatusText.textContent = 'Online - AI features are available';
                }
                enableAIFeatures();
            } else {
                isAIServiceOnline = false;
                if (aiStatusIndicator) {
                    aiStatusIndicator.className = 'w-3 h-3 rounded-full bg-red-500';
                }
                if (aiStatusText) {
                    aiStatusText.textContent = 'Offline - AI features are unavailable';
                }
                disableAIFeatures();
            }
        } catch (error) {
            console.error('[AI Status] Health check failed:', error.message);
            isAIServiceOnline = false;
            if (aiStatusIndicator) {
                aiStatusIndicator.className = 'w-3 h-3 rounded-full bg-red-500';
            }
            if (aiStatusText) {
                aiStatusText.textContent = 'Offline - Cannot reach AI service';
            }
            disableAIFeatures();
        }
    }
    
    /**
     * Enable all AI-dependent features
     */
    function enableAIFeatures() {
        // Enable upload button
        if (uploadFileBtn) {
            uploadFileBtn.disabled = false;
            uploadFileBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            uploadFileBtn.title = '';
        }
        
        // Enable YouTube button
        if (summarizeYoutubeBtn) {
            summarizeYoutubeBtn.disabled = false;
            summarizeYoutubeBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            summarizeYoutubeBtn.title = '';
        }
        
        // Enable file input
        if (fileInput) {
            fileInput.disabled = false;
        }
    }
    
    /**
     * Disable all AI-dependent features
     */
    function disableAIFeatures() {
        // Disable upload button
        if (uploadFileBtn) {
            uploadFileBtn.disabled = true;
            uploadFileBtn.classList.add('opacity-50', 'cursor-not-allowed');
            uploadFileBtn.title = 'AI service is currently offline';
        }
        
        // Disable YouTube button
        if (summarizeYoutubeBtn) {
            summarizeYoutubeBtn.disabled = true;
            summarizeYoutubeBtn.classList.add('opacity-50', 'cursor-not-allowed');
            summarizeYoutubeBtn.title = 'AI service is currently offline';
        }
        
        // Disable file input
        if (fileInput) {
            fileInput.disabled = true;
        }
    }
    
    function loadQuizMaterials() {
        fetchQuizMaterials();
    }
    
    /**
     * Fetch and display materials for quiz generation
     */
    async function fetchQuizMaterials() {
        const data = await fetchAPI('/content');
        if (data && data.content) {
            displayQuizMaterialsList(data.content);
        }
    }
    
    /**
     * Display materials list on the quiz page
     * @param {Array} materials - Array of material objects
     */
    function displayQuizMaterialsList(materials) {
        quizMaterialsContainer.innerHTML = '';
        
        if (!materials || materials.length === 0) {
            quizMaterialsContainer.innerHTML = `
                <div class="text-center py-8">
                    <div class="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                        <i data-lucide="inbox" class="w-8 h-8 text-gray-400"></i>
                    </div>
                    <p class="text-gray-600 dark:text-gray-400">No study materials available. Upload files to generate quizzes!</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }
        
        materials.forEach(material => {
            const materialItem = document.createElement('div');
            materialItem.className = 'flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200';
            
            let fileIcon = 'file-text';
            if (material.filename.endsWith('.pdf')) {
                fileIcon = 'file-text';
            } else if (material.filename.endsWith('.docx')) {
                fileIcon = 'file-text';
            } else if (material.filename.endsWith('.pptx')) {
                fileIcon = 'presentation';
            }
            
            const disabledClass = !isAIServiceOnline ? 'opacity-50 cursor-not-allowed' : '';
            const disabledAttr = !isAIServiceOnline ? 'disabled' : '';
            const disabledTitle = !isAIServiceOnline ? 'AI service is currently offline' : 'Start Quiz';
            
            materialItem.innerHTML = `
                <div class="flex items-center gap-3 flex-1">
                    <div class="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                        <i data-lucide="${fileIcon}" class="w-5 h-5 text-indigo-600 dark:text-indigo-400"></i>
                    </div>
                    <span class="text-gray-900 dark:text-white font-medium">${material.filename}</span>
                </div>
                <button class="quiz-btn px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 font-medium ${disabledClass}" data-id="${material._id}" data-filename="${material.filename}" ${disabledAttr} title="${disabledTitle}">
                    Start Quiz
                </button>
            `;
            
            quizMaterialsContainer.appendChild(materialItem);
        });
        
        lucide.createIcons();
    }
    
    function loadAnalytics() {
        fetchQuizResults();
    }
    
    /**
     * Fetch and display quiz analytics
     */
    async function fetchQuizResults() {
        const data = await fetchAPI('/quiz/results');
        
        if (data && data.results) {
            displayQuizChart(data.results);
        }
    }
    
    /**
     * Display quiz results in a chart
     * @param {Array} results - Array of quiz result objects
     */
    function displayQuizChart(results) {
        // Destroy existing chart if it exists
        if (quizChartInstance) {
            quizChartInstance.destroy();
        }
        
        if (!results || results.length === 0) {
            const ctx = quizChart.getContext('2d');
            ctx.clearRect(0, 0, quizChart.width, quizChart.height);
            
            // Display message when no results
            const parentDiv = quizChart.parentElement;
            parentDiv.innerHTML = `
                <div class="text-center py-12">
                    <div class="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                        <i data-lucide="bar-chart-2" class="w-8 h-8 text-gray-400"></i>
                    </div>
                    <p class="text-gray-600 dark:text-gray-400">No quiz results yet. Complete a quiz to see your analytics!</p>
                </div>
                <canvas id="quiz-chart" class="hidden"></canvas>
            `;
            lucide.createIcons();
            return;
        }
        
        // Prepare data for chart
        const labels = results.map((result, index) => {
            const date = new Date(result.created_at);
            return `Quiz ${index + 1} (${date.toLocaleDateString()})`;
        });
        
        const scores = results.map(result => {
            const percentage = (result.score / result.total_questions) * 100;
            return Math.round(percentage);
        });
        
        // Create chart
        const ctx = quizChart.getContext('2d');
        quizChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Quiz Score (%)',
                    data: scores,
                    backgroundColor: 'rgba(99, 102, 241, 0.6)',
                    borderColor: 'rgba(99, 102, 241, 1)',
                    borderWidth: 2,
                    borderRadius: 8,
                    barThickness: 50
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151',
                            font: {
                                size: 14,
                                family: 'Inter'
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: {
                            size: 14,
                            family: 'Inter'
                        },
                        bodyFont: {
                            size: 13,
                            family: 'Inter'
                        },
                        padding: 12,
                        cornerRadius: 8
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280',
                            font: {
                                size: 12,
                                family: 'Inter'
                            },
                            callback: function(value) {
                                return value + '%';
                            }
                        },
                        grid: {
                            color: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb'
                        }
                    },
                    x: {
                        ticks: {
                            color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280',
                            font: {
                                size: 12,
                                family: 'Inter'
                            }
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
    
    async function fetchUserProfile() {
        const userData = await fetchAPI('/users/me');
        if (userData) {
            console.log('[DEBUG] User profile data:', userData);
            console.log('[DEBUG] Profile picture URL:', userData.picture);
            
            const fullName = userData.full_name || 'User';
            // Set username in sidebar only (removed from header to avoid duplication)
            userName.textContent = fullName;
            
            // Display profile picture if available
            if (userData.picture) {
                console.log('[DEBUG] Setting profile picture:', userData.picture);
                
                // Update sidebar avatar
                userAvatar.src = userData.picture;
                userAvatar.classList.remove('hidden');
                userAvatar.onerror = function() {
                    console.error('[ERROR] Failed to load sidebar avatar image:', userData.picture);
                    userAvatar.classList.add('hidden');
                };
                userAvatar.onload = function() {
                    console.log('[DEBUG] Sidebar avatar loaded successfully');
                };
                
                const userIcon = userAvatarContainer.querySelector('[data-lucide="user"]');
                if (userIcon) {
                    userIcon.classList.add('hidden');
                }
                
                // Also update header avatar (top-right corner)
                headerUserAvatar.src = userData.picture;
                headerUserAvatar.classList.remove('hidden');
                headerUserAvatar.onerror = function() {
                    console.error('[ERROR] Failed to load header avatar image:', userData.picture);
                    headerUserAvatar.classList.add('hidden');
                };
                headerUserAvatar.onload = function() {
                    console.log('[DEBUG] Header avatar loaded successfully');
                };
                
                const headerUserIcon = headerUserAvatarContainer.querySelector('[data-lucide="user"]');
                if (headerUserIcon) {
                    headerUserIcon.classList.add('hidden');
                }
            } else {
                console.log('[DEBUG] No profile picture available');
            }
        }
    }
    
    async function fetchAndDisplayContent() {
        const data = await fetchAPI('/content');
        if (data && data.content) {
            displayMaterials(data.content);
        }
    }
    
    async function fetchAndDisplayAnalytics() {
        console.log('Fetching analytics...');
        // To be implemented
    }
    
    /**
     * Display study materials on the dashboard
     * @param {Array} materials - Array of material objects
     */
    function displayMaterials(materials) {
        materialsContainer.innerHTML = '';
        
        if (!materials || materials.length === 0) {
            materialsContainer.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <div class="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                        <i data-lucide="inbox" class="w-8 h-8 text-gray-400"></i>
                    </div>
                    <p class="text-gray-600 dark:text-gray-400">No study materials yet. Upload your first file to get started!</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }
        
        // Sort materials by creation date (newest first)
        const sortedMaterials = [...materials].sort((a, b) => {
            return new Date(b.created_at) - new Date(a.created_at);
        });
        
        sortedMaterials.forEach(material => {
            const materialCard = document.createElement('div');
            materialCard.className = 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg transition-shadow duration-200';
            
            // Determine file icon based on file type
            let fileIcon = 'file-text';
            if (material.filename.endsWith('.pdf')) {
                fileIcon = 'file-text';
            } else if (material.filename.endsWith('.docx')) {
                fileIcon = 'file-text';
            } else if (material.filename.endsWith('.pptx')) {
                fileIcon = 'presentation';
            }
            
            const disabledClass = !isAIServiceOnline ? 'opacity-50 cursor-not-allowed' : '';
            const disabledAttr = !isAIServiceOnline ? 'disabled' : '';
            const disabledTitle = !isAIServiceOnline ? 'AI service is currently offline' : '';
            
            materialCard.innerHTML = `
                <div class="flex items-start gap-4 mb-4">
                    <div class="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <i data-lucide="${fileIcon}" class="w-6 h-6 text-indigo-600 dark:text-indigo-400"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="text-lg font-semibold text-gray-900 dark:text-white truncate mb-1">${material.filename}</h4>
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                            Uploaded ${formatDate(material.created_at)}
                        </p>
                    </div>
                </div>
                
                <div class="flex gap-2">
                    <button class="summarize-btn flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 flex items-center justify-center gap-2 font-medium ${disabledClass}" data-id="${material._id}" ${disabledAttr} title="${disabledTitle}">
                        <i data-lucide="sparkles" class="w-4 h-4"></i>
                        <span>Summarize & Chat</span>
                    </button>
                    <button class="delete-btn px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors duration-200" data-id="${material._id}" title="Delete">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            `;
            
            materialsContainer.appendChild(materialCard);
        });
        
        lucide.createIcons();
    }
    
    /**
     * Format date for display
     * @param {string} dateString - ISO date string
     * @returns {string} Formatted date
     */
    function formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return 'Today';
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
    }
    
    async function handleSummarize(contentId) {
        // Check AI service health before summarizing
        await checkAIServiceStatus();
        
        // Check if AI service is online
        if (!isAIServiceOnline) {
            showNotification('AI service is currently offline. Please try again later.', 'error');
            return;
        }
        
        // Get the summary button and disable it
        const summaryBtn = document.querySelector(`.summarize-btn[data-id="${contentId}"]`);
        
        // Check if already processing
        if (summaryBtn && summaryBtn.disabled) {
            showNotification('Summary is already being generated, please wait...', 'warning');
            return;
        }
        
        // Disable button and show loading state
        let originalHTML = '';
        if (summaryBtn) {
            summaryBtn.disabled = true;
            originalHTML = summaryBtn.innerHTML;
            summaryBtn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i><span>Generating...</span>';
            lucide.createIcons();
        }
        
        try {
            // Find the material to get its filename
            const materials = await fetchAPI('/content');
            if (!materials || !materials.content) {
                throw new Error('Failed to load materials');
            }
            
            const material = materials.content.find(m => m._id === contentId);
            if (!material) {
                throw new Error('Material not found');
            }
            
            // Set active chat document
            activeChatDocument.id = contentId;
            activeChatDocument.filename = material.filename;
            
            // Show loading notification
            showNotification('Generating summary...', 'info');
            
            // Request summary from backend
            const data = await fetchAPI(`/content/${contentId}/summarize`, {
                method: 'POST'
            });
            
            if (data && data.summary) {
                // Navigate to chat page
                navigateTo('chat');
                
                // Update chat context
                chatContextName.textContent = material.filename;
                
                // Clear previous messages
                chatMessages.innerHTML = '';
                
                // Add summary as first message
                addMessageToChat('AI', data.summary);
                
                showNotification('Summary generated successfully!', 'success');
            } else {
                throw new Error('No summary returned from AI service');
            }
        } catch (error) {
            console.error('Summary error:', error);
            showNotification('Failed to generate summary: ' + (error.message || 'Unknown error'), 'error');
        } finally {
            // Re-enable button and restore original text
            if (summaryBtn) {
                summaryBtn.disabled = false;
                summaryBtn.innerHTML = originalHTML;
                lucide.createIcons();
            }
        }
    }
    
    async function handleQuizGeneration(contentId) {
        // Check AI service health before generating quiz
        await checkAIServiceStatus();
        
        // Check if AI service is online
        if (!isAIServiceOnline) {
            showNotification('AI service is currently offline. Please try again later.', 'error');
            return;
        }
        
        // Get the button element to retrieve filename
        const quizBtn = document.querySelector(`.quiz-btn[data-id="${contentId}"]`);
        const filename = quizBtn ? quizBtn.dataset.filename : 'Quiz';
        
        // Check if already processing
        if (quizBtn && quizBtn.disabled) {
            showNotification('Quiz is already being generated, please wait...', 'warning');
            return;
        }
        
        // Disable button and show loading state
        let originalHTML = '';
        if (quizBtn) {
            quizBtn.disabled = true;
            originalHTML = quizBtn.innerHTML;
            quizBtn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Generating...';
            lucide.createIcons();
        }
        
        try {
            // Show loading notification
            showNotification('Generating quiz questions...', 'info');
            
            // Request quiz from backend
            const data = await fetchAPI(`/content/${contentId}/quiz`, {
                method: 'POST'
            });
            
            if (data && data.questions && data.questions.length > 0) {
                // Initialize quiz state
                currentQuizState = {
                    quizData: data.questions,
                    currentQuestionIndex: 0,
                    score: 0,
                    contentId: contentId,
                    filename: filename
                };
                
                // Navigate to interactive quiz page
                navigateTo('interactive-quiz');
                
                // Display first question
                displayQuizQuestion();
                
                showNotification('Quiz generated successfully!', 'success');
            } else {
                showNotification('Failed to generate quiz questions', 'error');
            }
        } catch (error) {
            showNotification('Failed to generate quiz: ' + (error.message || 'Unknown error'), 'error');
        } finally {
            // Re-enable button and restore original text
            if (quizBtn) {
                quizBtn.disabled = false;
                quizBtn.innerHTML = originalHTML;
                lucide.createIcons();
            }
        }
    }
    
    /**
     * Display the current quiz question
     */
    function displayQuizQuestion() {
        const { quizData, currentQuestionIndex, filename } = currentQuizState;
        
        if (currentQuestionIndex >= quizData.length) {
            // Quiz complete
            finishQuiz();
            return;
        }
        
        const question = quizData[currentQuestionIndex];
        
        // Update quiz title and progress
        quizTitle.textContent = `Quiz: ${filename}`;
        quizProgress.textContent = `Question ${currentQuestionIndex + 1} of ${quizData.length}`;
        
        // Update question text
        quizQuestionText.textContent = question.question;
        
        // Clear and populate options
        quizOptionsForm.innerHTML = '';
        
        question.options.forEach((option, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'flex items-center p-4 border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors duration-200 cursor-pointer';
            
            optionDiv.innerHTML = `
                <input 
                    type="radio" 
                    id="option-${index}" 
                    name="quiz-option" 
                    value="${index}" 
                    class="w-5 h-5 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                >
                <label for="option-${index}" class="ml-3 flex-1 text-gray-900 dark:text-white cursor-pointer">
                    ${option}
                </label>
            `;
            
            quizOptionsForm.appendChild(optionDiv);
        });
        
        // Reset button states
        submitAnswerBtn.classList.remove('hidden');
        nextQuestionBtn.classList.add('hidden');
        
        // Enable all radio buttons
        const radioButtons = quizOptionsForm.querySelectorAll('input[type="radio"]');
        radioButtons.forEach(radio => radio.disabled = false);
    }
    
    function handleDelete(contentId) {
        if (confirm('Are you sure you want to delete this file?')) {
            deleteContent(contentId);
        }
    }
    
    /**
     * Delete content from server
     * @param {string} contentId - ID of the content to delete
     */
    async function deleteContent(contentId) {
        const data = await fetchAPI(`/content/${contentId}`, {
            method: 'DELETE'
        });
        
        if (data) {
            showNotification('File deleted successfully', 'success');
            // Refresh both dashboard and quiz materials lists
            await Promise.all([
                fetchAndDisplayContent(),
                fetchQuizMaterials()
            ]);
        }
    }
    
    function deleteTask(taskId) {
        console.log('Delete task:', taskId);
        // To be implemented
    }
    
    async function handleFileUpload() {
        // Check AI service health before upload
        await checkAIServiceStatus();
        
        // Check if AI service is online
        if (!isAIServiceOnline) {
            showNotification('AI service is currently offline. Please try again later.', 'error');
            fileInput.value = '';
            return;
        }
        
        const file = fileInput.files[0];
        if (!file) return;
        
        // Validate file type
        const allowedTypes = ['.pdf', '.docx', '.pptx'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!allowedTypes.includes(fileExtension)) {
            showNotification('Please upload a PDF, DOCX, or PPTX file', 'error');
            fileInput.value = '';
            return;
        }
        
        // Show loading notification
        showNotification('Uploading file...', 'info');
        
        // Create FormData and upload
        const formData = new FormData();
        formData.append('file', file);
        
        uploadFile(formData);
        
        // Reset file input
        fileInput.value = '';
    }
    
    /**
     * Upload file to server
     * @param {FormData} formData - Form data containing the file
     */
    async function uploadFile(formData) {
        const accessToken = localStorage.getItem('access_token');
        
        if (!accessToken) {
            showLoginPage();
            return;
        }
        
        try {
            const response = await fetch(`${API_BASE_URL}/content/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                },
                body: formData
            });
            
            if (response.status === 401) {
                localStorage.removeItem('access_token');
                showLoginPage();
                showNotification('Session expired. Please login again.', 'error');
                return;
            }
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Upload failed' }));
                throw new Error(errorData.detail || 'Upload failed');
            }
            
            const data = await response.json();
            showNotification('File uploaded successfully!', 'success');
            
            // Refresh both dashboard and quiz materials lists
            await Promise.all([
                fetchAndDisplayContent(),
                fetchQuizMaterials()
            ]);
            
        } catch (error) {
            console.error('Upload error:', error);
            showNotification(error.message || 'Failed to upload file', 'error');
        }
    }
    
    /**
     * Open YouTube summarize modal
     */
    async function handleYoutubeSummarize() {
        // Check AI service health before opening modal
        await checkAIServiceStatus();
        
        // Check if AI service is online
        if (!isAIServiceOnline) {
            showNotification('AI service is currently offline. Please try again later.', 'error');
            return;
        }
        
        // Clear previous input
        youtubeUrlInput.value = '';
        
        // Show modal
        youtubeModal.classList.remove('hidden');
        youtubeModal.classList.add('flex');
        
        // Focus on input
        setTimeout(() => youtubeUrlInput.focus(), 100);
    }
    
    /**
     * Close YouTube modal
     */
    function closeYoutubeModalHandler() {
        youtubeModal.classList.add('hidden');
        youtubeModal.classList.remove('flex');
        
        // Reset form
        youtubeForm.classList.remove('hidden');
        youtubeLoading.classList.add('hidden');
        youtubeUrlInput.value = '';
    }
    
    /**
     * Handle YouTube form submission
     */
    async function handleYoutubeSubmit(event) {
        event.preventDefault();
        
        const youtubeUrl = youtubeUrlInput.value.trim();
        
        if (!youtubeUrl) {
            showNotification('Please enter a YouTube URL', 'error');
            return;
        }
        
        // Basic YouTube URL validation
        if (!youtubeUrl.includes('youtube.com') && !youtubeUrl.includes('youtu.be')) {
            showNotification('Please enter a valid YouTube URL', 'error');
            return;
        }
        
        // Show loading state
        youtubeForm.classList.add('hidden');
        youtubeLoading.classList.remove('hidden');
        
        try {
            // Request summary from backend
            const data = await fetchAPI('/api/youtube/summarize', {
                method: 'POST',
                body: JSON.stringify({ url: youtubeUrl })
            });
            
            if (data && data.summary) {
                // Set active chat document for YouTube
                activeChatDocument.id = 'youtube';
                activeChatDocument.filename = 'YouTube Video';
                
                // Close modal
                closeYoutubeModalHandler();
                
                // Navigate to chat page
                navigateTo('chat');
                
                // Update chat context
                chatContextName.textContent = 'YouTube Video Summary';
                
                // Clear previous messages
                chatMessages.innerHTML = '';
                
                // Add summary as first message
                addMessageToChat('AI', data.summary);
                
                showNotification('YouTube video summarized successfully!', 'success');
            }
        } catch (error) {
            console.error('YouTube summarize error:', error);
            
            // Reset UI to show form again
            youtubeForm.classList.remove('hidden');
            youtubeLoading.classList.add('hidden');
        }
    }
    
    /**
     * Add a message to the chat
     * @param {string} sender - 'User' or 'AI'
     * @param {string} message - Message text
     */
    /**
     * Convert Markdown to HTML using marked.js library
     * @param {string} markdown - Markdown text
     * @returns {string} HTML string
     */
    function markdownToHTML(markdown) {
        if (!markdown) return '';
        
        // Extra cleanup: Remove code fences if backend missed them
        markdown = markdown.replace(/^```(?:markdown|md)?\s*\n/gm, '');
        markdown = markdown.replace(/\n```\s*$/gm, '');
        markdown = markdown.replace(/^```\s*$/gm, '');
        
        // Configure marked.js options
        marked.setOptions({
            breaks: true,        // Convert \n to <br>
            gfm: true,          // GitHub Flavored Markdown
            headerIds: false,   // Don't add IDs to headers
            mangle: false       // Don't escape autolinked email addresses
        });
        
        // Convert markdown to HTML
        return marked.parse(markdown);
    }
    
    function addMessageToChat(sender, message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `flex ${sender === 'User' ? 'justify-end' : 'justify-start'}`;
        
        const isUser = sender === 'User';
        
        // Convert markdown to HTML for AI messages (summaries)
        const formattedMessage = isUser ? message : markdownToHTML(message);
        
        messageDiv.innerHTML = `
            <div class="max-w-[80%] ${isUser ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'} rounded-lg px-4 py-3">
                <div class="flex items-center gap-2 mb-1">
                    <i data-lucide="${isUser ? 'user' : 'bot'}" class="w-4 h-4 ${isUser ? 'text-indigo-200' : 'text-gray-500 dark:text-gray-400'}"></i>
                    <span class="text-xs font-semibold ${isUser ? 'text-indigo-200' : 'text-gray-500 dark:text-gray-400'}">${sender}</span>
                </div>
                <div class="${isUser ? 'text-sm whitespace-pre-wrap' : 'text-sm markdown-content'}">${formattedMessage}</div>
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
        lucide.createIcons();
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    /**
     * Send a chat message
     * @param {string} message - User's message
     */
    async function sendChatMessage(message) {
        // Check AI service health before sending message
        await checkAIServiceStatus();
        
        // Check if AI service is online
        if (!isAIServiceOnline) {
            showNotification('AI service is currently offline. Please try again later.', 'error');
            return;
        }
        
        if (!activeChatDocument.id) {
            showNotification('No document selected for chat', 'error');
            return;
        }
        
        // Add user message to chat
        addMessageToChat('User', message);
        
        // Show typing indicator
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typing-indicator';
        typingDiv.className = 'flex justify-start';
        typingDiv.innerHTML = `
            <div class="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-3">
                <div class="flex items-center gap-2">
                    <div class="flex gap-1">
                        <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                        <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                    </div>
                    <span class="text-xs text-gray-500 dark:text-gray-400">AI is thinking...</span>
                </div>
            </div>
        `;
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Send message to backend
        const data = await fetchAPI(`/content/${activeChatDocument.id}/ask`, {
            method: 'POST',
            body: JSON.stringify({ question: message })
        });
        
        // Remove typing indicator
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
        
        if (data && data.answer) {
            addMessageToChat('AI', data.answer);
        } else {
            addMessageToChat('AI', 'Sorry, I could not generate a response. Please try again.');
        }
    }
    
    function openDailyTasksModal() {
        tasksModal.classList.add('active');
        loadTasks();
    }
    
    /**
     * Load tasks from localStorage
     */
    function loadTasks() {
        const savedTasks = localStorage.getItem('dailyTasks');
        if (savedTasks) {
            tasks = JSON.parse(savedTasks);
        }
        displayTasks();
    }
    
    /**
     * Save tasks to localStorage
     */
    function saveTasks() {
        localStorage.setItem('dailyTasks', JSON.stringify(tasks));
    }
    
    /**
     * Display tasks in the modal
     */
    function displayTasks() {
        taskList.innerHTML = '';
        
        if (tasks.length === 0) {
            taskList.innerHTML = `
                <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                    <i data-lucide="list-checks" class="w-12 h-12 mx-auto mb-2 text-gray-400"></i>
                    <p>No tasks yet. Add your first task above!</p>
                </div>
            `;
            lucide.createIcons();
            congratsMessage.classList.add('hidden');
            return;
        }
        
        tasks.forEach((task, index) => {
            const taskItem = document.createElement('div');
            taskItem.className = 'flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg';
            
            taskItem.innerHTML = `
                <input 
                    type="checkbox" 
                    ${task.completed ? 'checked' : ''} 
                    class="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer task-checkbox" 
                    data-index="${index}"
                >
                <span class="flex-1 ${task.completed ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}">${task.text}</span>
                <button class="delete-task-btn p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors duration-200" data-id="${index}">
                    <i data-lucide="trash-2" class="w-4 h-4 text-red-600 dark:text-red-400"></i>
                </button>
            `;
            
            taskList.appendChild(taskItem);
        });
        
        lucide.createIcons();
        checkAllTasksCompleted();
    }
    
    /**
     * Add a new task
     * @param {string} taskText - Task description
     */
    function addTask(taskText) {
        tasks.push({
            text: taskText,
            completed: false,
            id: Date.now()
        });
        saveTasks();
        displayTasks();
    }
    
    /**
     * Delete a task
     * @param {number} taskId - Task index
     */
    function deleteTask(taskId) {
        tasks.splice(parseInt(taskId), 1);
        saveTasks();
        displayTasks();
    }
    
    /**
     * Handle task checkbox toggle
     * @param {Event} e - Change event
     */
    function handleTaskToggle(e) {
        if (e.target.classList.contains('task-checkbox')) {
            const index = parseInt(e.target.dataset.index);
            tasks[index].completed = e.target.checked;
            saveTasks();
            displayTasks();
        }
    }
    
    /**
     * Check if all tasks are completed
     */
    function checkAllTasksCompleted() {
        const allCompleted = tasks.length > 0 && tasks.every(task => task.completed);
        
        if (allCompleted) {
            congratsMessage.classList.remove('hidden');
        } else {
            congratsMessage.classList.add('hidden');
        }
    }
    
    // ============================================================================
    // FLOATING TASKS WIDGET FUNCTIONS
    // ============================================================================
    
    /**
     * Show floating tasks widget (only on dashboard)
     */
    function showFloatingTasksWidget() {
        if (floatingTasksWidget) {
            floatingTasksWidget.classList.remove('hidden');
            loadFloatingTasks();
            lucide.createIcons();
        }
    }
    
    /**
     * Hide floating tasks widget
     */
    function hideFloatingTasksWidget() {
        if (floatingTasksWidget) {
            floatingTasksWidget.classList.add('hidden');
        }
    }
    
    /**
     * Minimize floating tasks widget
     */
    function minimizeFloatingTasksWidget() {
        isTasksWidgetMinimized = true;
        tasksWidgetBody.classList.add('hidden');
        tasksWidgetMinimized.classList.remove('hidden');
        lucide.createIcons();
    }
    
    /**
     * Expand floating tasks widget
     */
    function expandFloatingTasksWidget() {
        isTasksWidgetMinimized = false;
        tasksWidgetBody.classList.remove('hidden');
        tasksWidgetMinimized.classList.add('hidden');
        lucide.createIcons();
    }
    
    /**
     * Load tasks into floating widget
     */
    function loadFloatingTasks() {
        const savedTasks = localStorage.getItem('dailyTasks');
        if (savedTasks) {
            tasks = JSON.parse(savedTasks);
        }
        displayFloatingTasks();
    }
    
    /**
     * Display tasks in floating widget
     */
    function displayFloatingTasks() {
        floatingTaskList.innerHTML = '';
        
        if (tasks.length === 0) {
            floatingTaskList.innerHTML = `
                <p class="text-center text-gray-500 dark:text-gray-400 text-sm py-4">No tasks yet. Add your first task!</p>
            `;
            return;
        }
        
        tasks.forEach((task, index) => {
            const taskItem = document.createElement('div');
            taskItem.className = 'flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors';
            
            taskItem.innerHTML = `
                <input 
                    type="checkbox" 
                    ${task.completed ? 'checked' : ''} 
                    class="w-4 h-4 text-green-600 rounded focus:ring-green-500 cursor-pointer floating-task-checkbox" 
                    data-index="${index}"
                >
                <span class="flex-1 text-sm ${task.completed ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}">${task.text}</span>
                <button class="delete-floating-task-btn p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors" data-id="${index}">
                    <i data-lucide="trash-2" class="w-3 h-3 text-red-600 dark:text-red-400"></i>
                </button>
            `;
            
            floatingTaskList.appendChild(taskItem);
        });
        
        lucide.createIcons();
        attachFloatingTaskListeners();
    }
    
    /**
     * Handle adding task from floating widget
     */
    function handleFloatingTaskAdd(e) {
        e.preventDefault();
        const taskText = floatingTaskInput.value.trim();
        
        if (taskText) {
            tasks.push({
                text: taskText,
                completed: false,
                id: Date.now()
            });
            saveTasks();
            displayFloatingTasks();
            floatingTaskInput.value = '';
            
            // Show success notification
            showNotification('Task added successfully!', 'success');
        }
    }
    
    /**
     * Attach event listeners to floating task list items
     */
    function attachFloatingTaskListeners() {
        // Checkbox listeners
        const checkboxes = floatingTaskList.querySelectorAll('.floating-task-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                tasks[index].completed = e.target.checked;
                saveTasks();
                displayFloatingTasks();
                
                // Show congrats if all completed
                if (tasks.every(t => t.completed)) {
                    showNotification('🎉 All tasks completed! Great job!', 'success');
                }
            });
        });
        
        // Delete button listeners
        const deleteButtons = floatingTaskList.querySelectorAll('.delete-floating-task-btn');
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const taskId = e.currentTarget.dataset.id;
                tasks.splice(parseInt(taskId), 1);
                saveTasks();
                displayFloatingTasks();
                showNotification('Task deleted', 'info');
            });
        });
    }
    
    function openTimerModal() {
        timerModal.classList.add('active');
        isTimerMinimized = false;
        if (floatingTimer) {
            floatingTimer.style.display = 'none';
        }
    }
    
    function minimizeTimer() {
        timerModal.classList.remove('active');
        isTimerMinimized = true;
        if (floatingTimer) {
            floatingTimer.style.display = 'block';
            updateTimerDisplay();
            updateFloatingTimerButton();
        }
    }
    
    function expandTimer() {
        if (floatingTimer) {
            floatingTimer.style.display = 'none';
        }
        isTimerMinimized = false;
        timerModal.classList.add('active');
    }
    
    function updateFloatingTimerButton() {
        if (!floatingPauseBtn) return;
        
        const icon = floatingPauseBtn.querySelector('[data-lucide]');
        if (isTimerRunning) {
            icon.setAttribute('data-lucide', 'pause');
            floatingPauseBtn.setAttribute('title', 'Pause');
        } else {
            icon.setAttribute('data-lucide', 'play');
            floatingPauseBtn.setAttribute('title', 'Resume');
        }
        lucide.createIcons();
    }
    
    function toggleTimer() {
        if (isTimerRunning) {
            // Pause timer
            clearInterval(timerInterval);
            isTimerRunning = false;
            startTimerBtn.textContent = 'Resume';
            startTimerBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
            startTimerBtn.classList.add('bg-blue-600', 'hover:bg-blue-700');
            updateFloatingTimerButton();
        } else {
            // Start timer
            isTimerRunning = true;
            startTimerBtn.textContent = 'Pause';
            startTimerBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
            startTimerBtn.classList.add('bg-yellow-600', 'hover:bg-yellow-700');
            updateFloatingTimerButton();
            
            timerInterval = setInterval(() => {
                timeLeft--;
                updateTimerDisplay();
                
                if (timeLeft <= 0) {
                    clearInterval(timerInterval);
                    isTimerRunning = false;
                    showNotification('Timer completed! Great job! 🎉', 'success');
                    playTimerCompletionAlert();
                    
                    // Show modal if minimized
                    if (isTimerMinimized) {
                        expandTimer();
                    }
                    
                    resetTimer();
                }
            }, 1000);
        }
    }
    
    function resetTimer() {
        clearInterval(timerInterval);
        isTimerRunning = false;
        timeLeft = defaultTimerDuration; // Reset to the selected duration
        updateTimerDisplay();
        startTimerBtn.textContent = 'Start';
        startTimerBtn.classList.remove('bg-yellow-600', 'hover:bg-yellow-700', 'bg-blue-600', 'hover:bg-blue-700');
        startTimerBtn.classList.add('bg-green-600', 'hover:bg-green-700');
        updateFloatingTimerButton();
    }
    
    /**
     * Set a custom timer duration
     */
    function setTimerDuration(minutes) {
        if (isTimerRunning) {
            clearInterval(timerInterval);
            isTimerRunning = false;
            startTimerBtn.textContent = 'Start';
            startTimerBtn.classList.remove('bg-yellow-600', 'hover:bg-yellow-700', 'bg-blue-600', 'hover:bg-blue-700');
            startTimerBtn.classList.add('bg-green-600', 'hover:bg-green-700');
        }
        
        defaultTimerDuration = minutes * 60;
        timeLeft = defaultTimerDuration;
        updateTimerDisplay();
        
        // Update preset button styles
        const presetButtons = document.querySelectorAll('.timer-preset-btn');
        presetButtons.forEach(btn => {
            const btnMinutes = parseInt(btn.getAttribute('data-minutes'));
            if (btnMinutes === minutes) {
                btn.classList.remove('bg-gray-100', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300');
                btn.classList.add('bg-indigo-100', 'dark:bg-indigo-900/30', 'text-indigo-700', 'dark:text-indigo-300', 'font-medium');
            } else {
                btn.classList.remove('bg-indigo-100', 'dark:bg-indigo-900/30', 'text-indigo-700', 'dark:text-indigo-300', 'font-medium');
                btn.classList.add('bg-gray-100', 'dark:bg-gray-700', 'text-gray-700', 'dark:text-gray-300');
            }
        });
    }
    
    /**
     * Update timer display
     */
    function updateTimerDisplay() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        timerDisplay.textContent = timeString;
        if (floatingTimerDisplay) {
            floatingTimerDisplay.textContent = timeString;
        }
    }
    
    /**
     * Play timer completion alert with sound and visual effects
     */
    function playTimerCompletionAlert() {
        // Create and play beep sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create three beeps
            const beepTimes = [0, 0.3, 0.6];
            beepTimes.forEach(time => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = 800; // 800 Hz beep
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + time);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + time + 0.2);
                
                oscillator.start(audioContext.currentTime + time);
                oscillator.stop(audioContext.currentTime + time + 0.2);
            });
        } catch (error) {
            console.log('Audio notification not supported');
        }
        
        // Screen flash effect
        const flashOverlay = document.createElement('div');
        flashOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(99, 102, 241, 0.3);
            z-index: 9999;
            pointer-events: none;
            animation: flash 0.5s ease-in-out 3;
        `;
        
        // Add CSS animation
        if (!document.getElementById('flash-animation-style')) {
            const style = document.createElement('style');
            style.id = 'flash-animation-style';
            style.textContent = `
                @keyframes flash {
                    0%, 100% { opacity: 0; }
                    50% { opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(flashOverlay);
        
        // Remove flash overlay after animation
        setTimeout(() => {
            flashOverlay.remove();
        }, 1500);
        
        // Vibrate if supported (mobile devices)
        if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200, 100, 200]);
        }
    }
    
    function handleSubmitAnswer() {
        const selectedOption = quizOptionsForm.querySelector('input[name="quiz-option"]:checked');
        
        if (!selectedOption) {
            showNotification('Please select an answer', 'error');
            return;
        }
        
        const { quizData, currentQuestionIndex } = currentQuizState;
        const question = quizData[currentQuestionIndex];
        const selectedAnswer = parseInt(selectedOption.value);
        const correctAnswer = question.correct_answer;
        
        // Disable all radio buttons
        const radioButtons = quizOptionsForm.querySelectorAll('input[type="radio"]');
        radioButtons.forEach(radio => radio.disabled = true);
        
        // Check if answer is correct
        const isCorrect = selectedAnswer === correctAnswer;
        
        if (isCorrect) {
            currentQuizState.score++;
        }
        
        // Show feedback modal with correct answer if wrong
        showAnswerFeedback(isCorrect, question.explanation || '', question.options[correctAnswer]);
        
        // Hide submit button, show next button
        submitAnswerBtn.classList.add('hidden');
        nextQuestionBtn.classList.remove('hidden');
    }
    
    /**
     * Show answer feedback modal
     * @param {boolean} isCorrect - Whether the answer was correct
     * @param {string} explanation - Explanation text
     * @param {string} correctAnswerText - The correct answer option text
     */
    function showAnswerFeedback(isCorrect, explanation, correctAnswerText) {
        if (isCorrect) {
            feedbackIconContainer.className = 'inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4';
            feedbackTitle.textContent = 'Correct!';
            feedbackTitle.className = 'text-2xl font-bold mb-2 text-green-600 dark:text-green-400';
            feedbackExplanation.textContent = explanation || 'Great job! You got it right.';
            
            // Recreate icon element completely for correct answer
            feedbackIconContainer.innerHTML = '<i data-lucide="check-circle" class="w-8 h-8 text-green-600 dark:text-green-400"></i>';
        } else {
            feedbackIconContainer.className = 'inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mb-4';
            feedbackTitle.textContent = 'Incorrect';
            feedbackTitle.className = 'text-2xl font-bold mb-2 text-red-600 dark:text-red-400';
            
            // Show explanation first
            let feedbackText = explanation || 'That\'s not quite right.';
            
            // Add correct answer with checkmark symbol
            if (correctAnswerText) {
                feedbackText += `\n\n✓ Correct Answer: ${correctAnswerText}`;
            }
            
            feedbackExplanation.textContent = feedbackText;
            
            // Recreate icon element completely for incorrect answer
            feedbackIconContainer.innerHTML = '<i data-lucide="x-circle" class="w-8 h-8 text-red-600 dark:text-red-400"></i>';
        }
        
        // Recreate all icons in the modal
        lucide.createIcons();
        answerFeedbackModal.classList.add('active');
    }
    
    function handleNextQuestion() {
        // Move to next question
        currentQuizState.currentQuestionIndex++;
        
        // Display next question or finish quiz
        displayQuizQuestion();
    }
    
    function handleQuitQuiz() {
        if (confirm('Are you sure you want to quit the quiz? Your progress will not be saved.')) {
            navigateTo('dashboard');
            
            // Reset quiz state
            currentQuizState = {
                quizData: [],
                currentQuestionIndex: 0,
                score: 0,
                contentId: null,
                filename: null
            };
        }
    }
    
    /**
     * Finish the quiz and show results
     */
    async function finishQuiz() {
        const { quizData, score, contentId, filename } = currentQuizState;
        const totalQuestions = quizData.length;
        const percentage = Math.round((score / totalQuestions) * 100);
        
        // Save quiz result to backend
        await saveQuizResult(contentId, score, totalQuestions);
        
        // Navigate to quiz summary page
        navigateTo('quiz-summary');
        
        // Update summary page
        quizSummarySubtitle.textContent = `You answered ${score} out of ${totalQuestions} questions correctly`;
        quizFinalScore.textContent = `${percentage}%`;
        
        // Reset quiz state
        currentQuizState = {
            quizData: [],
            currentQuestionIndex: 0,
            score: 0,
            contentId: null,
            filename: null
        };
    }
    
    /**
     * Save quiz result to backend
     * @param {string} contentId - ID of the content
     * @param {number} score - Number of correct answers
     * @param {number} totalQuestions - Total number of questions
     */
    async function saveQuizResult(contentId, score, totalQuestions) {
        await fetchAPI('/quiz/save', {
            method: 'POST',
            body: JSON.stringify({
                content_id: contentId,
                score: score,
                total_questions: totalQuestions
            })
        });
    }
    
    function toggleTheme() {
        const html = document.documentElement;
        const currentTheme = html.classList.contains('dark') ? 'dark' : 'light';
        
        if (currentTheme === 'dark') {
            // Switch to light mode
            html.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            
            // Update icon to sun (light mode active)
            const themeIcon = themeToggle.querySelector('[data-lucide]');
            if (themeIcon) {
                themeIcon.setAttribute('data-lucide', 'sun');
                lucide.createIcons();
            }
        } else {
            // Switch to dark mode
            html.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            
            // Update icon to moon (dark mode active)
            const themeIcon = themeToggle.querySelector('[data-lucide]');
            if (themeIcon) {
                themeIcon.setAttribute('data-lucide', 'moon');
                lucide.createIcons();
            }
        }
    }
    
    function handleLogout() {
        // Remove token from localStorage
        localStorage.removeItem('access_token');
        
        // Show notification
        showNotification('Logged out successfully', 'success');
        
        // Redirect to login page
        showLoginPage();
    }
    
    
    // ============================================================================
    // EVENT LISTENER SETUP
    // ============================================================================
    
    /**
     * Set up all event listeners for the application
     */
    function setupAllEventListeners() {
        // Event delegation for dynamically created buttons
        document.body.addEventListener('click', function(e) {
            // Summarize button (on materials)
            const summarizeBtn = e.target.closest('.summarize-btn');
            if (summarizeBtn) {
                e.preventDefault();
                const contentId = summarizeBtn.dataset.id;
                handleSummarize(contentId);
                return;
            }
            
            // Quiz button (on materials)
            const quizBtn = e.target.closest('.quiz-btn');
            if (quizBtn) {
                e.preventDefault();
                const contentId = quizBtn.dataset.id;
                handleQuizGeneration(contentId);
                return;
            }
            
            // Delete button (on materials)
            const deleteBtn = e.target.closest('.delete-btn');
            if (deleteBtn) {
                e.preventDefault();
                const contentId = deleteBtn.dataset.id;
                handleDelete(contentId);
                return;
            }
            
            // Delete task button
            const deleteTaskBtn = e.target.closest('.delete-task-btn');
            if (deleteTaskBtn) {
                e.preventDefault();
                const taskId = deleteTaskBtn.dataset.id;
                deleteTask(taskId);
                return;
            }
        });
        
        // Logout button
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }
        
        // Upload file button
        if (uploadFileBtn) {
            uploadFileBtn.addEventListener('click', () => {
                fileInput.click();
            });
        }
        
        // File input change
        if (fileInput) {
            fileInput.addEventListener('change', handleFileUpload);
        }
        
        // YouTube summarize button
        if (summarizeYoutubeBtn) {
            summarizeYoutubeBtn.addEventListener('click', handleYoutubeSummarize);
        }
        
        // Daily tasks button - Show floating widget
        if (dailyTasksBtn) {
            dailyTasksBtn.addEventListener('click', showFloatingTasksWidget);
        }
        
        // Floating tasks widget controls
        if (minimizeTasksWidget) {
            minimizeTasksWidget.addEventListener('click', minimizeFloatingTasksWidget);
        }
        
        if (expandTasksWidget) {
            expandTasksWidget.addEventListener('click', expandFloatingTasksWidget);
        }
        
        if (closeTasksWidget) {
            closeTasksWidget.addEventListener('click', hideFloatingTasksWidget);
        }
        
        if (floatingTaskForm) {
            floatingTaskForm.addEventListener('submit', handleFloatingTaskAdd);
        }
        
        // Timer button
        if (timerBtn) {
            timerBtn.addEventListener('click', openTimerModal);
        }
        
        // Timer modal controls
        if (closeTimerModal) {
            closeTimerModal.addEventListener('click', () => {
                timerModal.classList.remove('active');
                // If timer is running, minimize instead of closing
                if (isTimerRunning) {
                    minimizeTimer();
                }
            });
        }
        
        if (minimizeTimerBtn) {
            minimizeTimerBtn.addEventListener('click', minimizeTimer);
        }
        
        if (startTimerBtn) {
            startTimerBtn.addEventListener('click', toggleTimer);
        }
        
        if (resetTimerBtn) {
            resetTimerBtn.addEventListener('click', resetTimer);
        }
        
        // Floating timer controls
        if (expandTimerBtn) {
            expandTimerBtn.addEventListener('click', expandTimer);
        }
        
        if (floatingPauseBtn) {
            floatingPauseBtn.addEventListener('click', toggleTimer);
        }
        
        // Click on floating timer to expand
        if (floatingTimer) {
            floatingTimer.addEventListener('click', function(e) {
                // Don't expand if clicking on buttons
                if (!e.target.closest('button')) {
                    expandTimer();
                }
            });
        }
        
        // Tasks modal controls
        if (closeTasksModal) {
            closeTasksModal.addEventListener('click', () => {
                tasksModal.classList.remove('active');
            });
        }
        
        if (addTaskForm) {
            addTaskForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const taskText = newTaskInput.value.trim();
                if (taskText) {
                    addTask(taskText);
                    newTaskInput.value = '';
                }
            });
        }
        
        if (taskList) {
            taskList.addEventListener('change', handleTaskToggle);
        }
        
        // Answer feedback modal
        if (closeFeedbackModal) {
            closeFeedbackModal.addEventListener('click', () => {
                answerFeedbackModal.classList.remove('active');
                
                // Auto-advance to next question after closing feedback
                const { quizData, currentQuestionIndex } = currentQuizState;
                if (quizData && currentQuestionIndex < quizData.length - 1) {
                    // Small delay to let modal close smoothly
                    setTimeout(() => {
                        handleNextQuestion();
                    }, 150);
                }
            });
        }
        
        // YouTube modal
        if (youtubeForm) {
            youtubeForm.addEventListener('submit', handleYoutubeSubmit);
        }
        
        if (closeYoutubeModal) {
            closeYoutubeModal.addEventListener('click', closeYoutubeModalHandler);
        }
        
        if (cancelYoutubeBtn) {
            cancelYoutubeBtn.addEventListener('click', closeYoutubeModalHandler);
        }
        
        // Close modal when clicking outside
        if (youtubeModal) {
            youtubeModal.addEventListener('click', function(e) {
                if (e.target === youtubeModal) {
                    closeYoutubeModalHandler();
                }
            });
        }
        
        // Chat form
        if (chatForm) {
            chatForm.addEventListener('submit', function(e) {
                e.preventDefault();
                const question = chatInput.value.trim();
                if (question && activeChatDocument.id) {
                    sendChatMessage(question);
                    chatInput.value = '';
                }
            });
        }
        
        // Quiz controls
        if (submitAnswerBtn) {
            submitAnswerBtn.addEventListener('click', handleSubmitAnswer);
        }
        
        if (nextQuestionBtn) {
            nextQuestionBtn.addEventListener('click', handleNextQuestion);
        }
        
        if (quitQuizBtn) {
            quitQuizBtn.addEventListener('click', handleQuitQuiz);
        }
        
        if (backToDashboardBtn) {
            backToDashboardBtn.addEventListener('click', () => {
                navigateTo('dashboard');
            });
        }
        
        // Navigation links
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const page = this.dataset.page;
                navigateTo(page);
            });
        });
        
        // Theme toggle
        if (themeToggle) {
            themeToggle.addEventListener('click', toggleTheme);
        }
        
        // Close modals on backdrop click
        [timerModal, tasksModal, answerFeedbackModal].forEach(modal => {
            if (modal) {
                modal.addEventListener('click', function(e) {
                    if (e.target === modal) {
                        modal.classList.remove('active');
                    }
                });
            }
        });
        
        // Timer preset buttons
        const timerPresetButtons = document.querySelectorAll('.timer-preset-btn');
        timerPresetButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const minutes = parseInt(this.getAttribute('data-minutes'));
                setTimerDuration(minutes);
            });
        });
        
        // Custom timer input
        const customTimerInput = document.getElementById('custom-timer-input');
        const setCustomTimerBtn = document.getElementById('set-custom-timer-btn');
        
        if (setCustomTimerBtn && customTimerInput) {
            setCustomTimerBtn.addEventListener('click', function() {
                const minutes = parseInt(customTimerInput.value);
                if (minutes && minutes > 0 && minutes <= 180) {
                    setTimerDuration(minutes);
                    customTimerInput.value = '';
                    showNotification(`Timer set to ${minutes} minutes`, 'success');
                } else {
                    showNotification('Please enter a valid duration (1-180 minutes)', 'error');
                }
            });
            
            // Allow Enter key to set custom timer
            customTimerInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    setCustomTimerBtn.click();
                }
            });
        }
    }
    
    
    // ============================================================================
    // INITIALIZATION
    // ============================================================================
    
    /**
     * Initialize the application
     */
    async function initializeApp() {
        console.log('Initializing PrepGen application...');
        
        // Initialize theme from localStorage
        const savedTheme = localStorage.getItem('theme');
        const html = document.documentElement;
        
        if (savedTheme === 'dark') {
            html.classList.add('dark');
            if (themeToggle) {
                const themeIcon = themeToggle.querySelector('[data-lucide]');
                if (themeIcon) {
                    themeIcon.setAttribute('data-lucide', 'moon');
                }
            }
        } else {
            // Default to light mode
            html.classList.remove('dark');
            if (themeToggle) {
                const themeIcon = themeToggle.querySelector('[data-lucide]');
                if (themeIcon) {
                    themeIcon.setAttribute('data-lucide', 'sun');
                }
            }
        }
        
        // Check URL for token parameter (OAuth redirect)
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        
        if (token) {
            // Save token to localStorage
            localStorage.setItem('access_token', token);
            
            // Clean URL (remove token parameter)
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        
        // Check if user is already logged in
        const accessToken = localStorage.getItem('access_token');
        
        if (accessToken) {
            // User is logged in - show dashboard and load data
            showDashboard();
            setupAllEventListeners();
            
            // Load user data and content
            await fetchUserProfile();
            await fetchAndDisplayContent();
            await fetchAndDisplayAnalytics();
            
        } else {
            // User is not logged in - show login page
            showLoginPage();
        }
        
        // Initialize Lucide icons
        lucide.createIcons();
        
        console.log('PrepGen application initialized successfully');
    }
    
    
    // Start the application
    initializeApp();
    
});
