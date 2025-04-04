// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBEGJ8Sfw8nOZCN3wY8YhBtlGVp67tUCcg",
    authDomain: "project-01-fffa5.firebaseapp.com",
    projectId: "project-01-fffa5",
    storageBucket: "project-01-fffa5.firebasestorage.app",
    messagingSenderId: "989869504960",
    appId: "1:989869504960:web:910d5db9f752a21134f025"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// DOM Elements
const themeToggle = document.getElementById('themeToggle');
const accentColor = document.getElementById('accentColor');
const resetAccentColor = document.getElementById('resetAccentColor');
const emailNotifications = document.getElementById('emailNotifications');
const orderUpdates = document.getElementById('orderUpdates');
const customerQueries = document.getElementById('customerQueries');
const twoFactorAuth = document.getElementById('twoFactorAuth');
const sessionTimeout = document.getElementById('sessionTimeout');
const languageSelect = document.getElementById('languageSelect');
const currencySelect = document.getElementById('currencySelect');
const saveSettings = document.getElementById('saveSettings');
const resetSettings = document.getElementById('resetSettings');
const activityTypeFilter = document.getElementById('activityTypeFilter');
const activityDateFilter = document.getElementById('activityDateFilter');
const activityList = document.getElementById('activityList');

// Default settings
const defaultSettings = {
    theme: 'light',
    accentColor: '#0056b3',
    emailNotifications: true,
    orderUpdates: true,
    customerQueries: true,
    twoFactorAuth: false,
    sessionTimeout: 30,
    language: 'en',
    currency: 'ZAR'
};

// Current user settings
let currentSettings = { ...defaultSettings };

// Initialize settings
document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // Load settings from localStorage first for immediate effect
            const savedTheme = localStorage.getItem('theme');
            const savedAccentColor = localStorage.getItem('accentColor');
            
            if (savedTheme) {
                currentSettings.theme = savedTheme;
            }
            if (savedAccentColor) {
                currentSettings.accentColor = savedAccentColor;
            }
            
            // Apply initial settings
            applySettings();
            
            // Load full settings from Firestore
            await loadUserSettings(user.uid);
            setupEventListeners();
        } else {
            window.location.href = 'login.html';
        }
    });
});

// Load user settings from Firestore
async function loadUserSettings(userId) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists && userDoc.data().settings) {
            currentSettings = { ...defaultSettings, ...userDoc.data().settings };
            applySettings();
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Apply settings to the UI
function applySettings() {
    // Apply theme
    document.body.classList.toggle('dark-theme', currentSettings.theme === 'dark');
    if (themeToggle) {
        themeToggle.checked = currentSettings.theme === 'dark';
    }
    
    // Apply accent color
    if (accentColor) {
        accentColor.value = currentSettings.accentColor;
    }
    
    // Apply accent color to CSS variables
    document.documentElement.style.setProperty('--primary-color', currentSettings.accentColor);
    
    // Apply accent color variations for dark theme
    const accentColorRGB = hexToRGB(currentSettings.accentColor);
    document.documentElement.style.setProperty('--primary-color-light', `rgba(${accentColorRGB}, 0.1)`);
    document.documentElement.style.setProperty('--primary-color-dark', `rgba(${accentColorRGB}, 0.8)`);
    
    // Apply accent color to specific elements
    applyAccentColorToElements(currentSettings.accentColor);
    
    // Apply notification settings
    if (emailNotifications) emailNotifications.checked = currentSettings.emailNotifications;
    if (orderUpdates) orderUpdates.checked = currentSettings.orderUpdates;
    if (customerQueries) customerQueries.checked = currentSettings.customerQueries;
    
    // Apply security settings
    if (twoFactorAuth) twoFactorAuth.checked = currentSettings.twoFactorAuth;
    if (sessionTimeout) sessionTimeout.value = currentSettings.sessionTimeout;
    
    // Apply language and currency
    if (languageSelect) languageSelect.value = currentSettings.language;
    if (currencySelect) currencySelect.value = currentSettings.currency;

    // Save to localStorage for persistence
    localStorage.setItem('theme', currentSettings.theme);
    localStorage.setItem('accentColor', currentSettings.accentColor);
}

// Setup event listeners
function setupEventListeners() {
    // Theme toggle
    if (themeToggle) {
        themeToggle.addEventListener('change', () => {
            currentSettings.theme = themeToggle.checked ? 'dark' : 'light';
            document.body.classList.toggle('dark-theme', themeToggle.checked);
            saveSettingsToFirestore();
            localStorage.setItem('theme', currentSettings.theme);
        });
    }

    // Accent color
    if (accentColor) {
        accentColor.addEventListener('change', () => {
            currentSettings.accentColor = accentColor.value;
            document.documentElement.style.setProperty('--primary-color', accentColor.value);
            const accentColorRGB = hexToRGB(accentColor.value);
            document.documentElement.style.setProperty('--primary-color-light', `rgba(${accentColorRGB}, 0.1)`);
            document.documentElement.style.setProperty('--primary-color-dark', `rgba(${accentColorRGB}, 0.8)`);
            applyAccentColorToElements(accentColor.value);
            saveSettingsToFirestore();
            localStorage.setItem('accentColor', accentColor.value);
        });
    }

    // Reset accent color
    if (resetAccentColor) {
        resetAccentColor.addEventListener('click', () => {
            accentColor.value = defaultSettings.accentColor;
            currentSettings.accentColor = defaultSettings.accentColor;
            document.documentElement.style.setProperty('--primary-color', defaultSettings.accentColor);
            const accentColorRGB = hexToRGB(defaultSettings.accentColor);
            document.documentElement.style.setProperty('--primary-color-light', `rgba(${accentColorRGB}, 0.1)`);
            document.documentElement.style.setProperty('--primary-color-dark', `rgba(${accentColorRGB}, 0.8)`);
            applyAccentColorToElements(defaultSettings.accentColor);
            saveSettingsToFirestore();
            localStorage.setItem('accentColor', defaultSettings.accentColor);
        });
    }

    // Notification settings
    if (emailNotifications) {
        emailNotifications.addEventListener('change', () => {
            currentSettings.emailNotifications = emailNotifications.checked;
            saveSettingsToFirestore();
        });
    }

    if (orderUpdates) {
        orderUpdates.addEventListener('change', () => {
            currentSettings.orderUpdates = orderUpdates.checked;
            saveSettingsToFirestore();
        });
    }

    if (customerQueries) {
        customerQueries.addEventListener('change', () => {
            currentSettings.customerQueries = customerQueries.checked;
            saveSettingsToFirestore();
        });
    }

    // Security settings
    if (twoFactorAuth) {
        twoFactorAuth.addEventListener('change', () => {
            currentSettings.twoFactorAuth = twoFactorAuth.checked;
            saveSettingsToFirestore();
        });
    }

    if (sessionTimeout) {
        sessionTimeout.addEventListener('change', () => {
            currentSettings.sessionTimeout = parseInt(sessionTimeout.value);
            saveSettingsToFirestore();
        });
    }

    // Language and currency
    if (languageSelect) {
        languageSelect.addEventListener('change', () => {
            currentSettings.language = languageSelect.value;
            saveSettingsToFirestore();
        });
    }

    if (currencySelect) {
        currencySelect.addEventListener('change', () => {
            currentSettings.currency = currencySelect.value;
            saveSettingsToFirestore();
        });
    }

    // Save settings
    if (saveSettings) {
        saveSettings.addEventListener('click', () => {
            saveSettingsToFirestore();
        });
    }

    // Reset settings
    if (resetSettings) {
        resetSettings.addEventListener('click', () => {
            currentSettings = { ...defaultSettings };
            applySettings();
            saveSettingsToFirestore();
        });
    }

    // Activity log filters
    if (activityTypeFilter) {
        activityTypeFilter.addEventListener('change', loadActivityLog);
    }

    if (activityDateFilter) {
        activityDateFilter.addEventListener('change', loadActivityLog);
    }
}

// Save settings to Firestore
async function saveSettingsToFirestore() {
    try {
        const user = auth.currentUser;
        if (user) {
            await db.collection('users').doc(user.uid).update({
                settings: currentSettings
            });
            showSuccessModal('Settings saved successfully');
        }
    } catch (error) {
        console.error('Error saving settings:', error);
        showErrorModal('Error saving settings');
    }
}

// Load activity log
async function loadActivityLog() {
    try {
        const user = auth.currentUser;
        if (!user) return;

        const typeFilter = activityTypeFilter.value;
        const dateFilter = activityDateFilter.value;
        let query = db.collection('activityLog').where('userId', '==', user.uid);

        if (typeFilter !== 'all') {
            query = query.where('type', '==', typeFilter);
        }

        // Apply date filter
        const now = new Date();
        let startDate = new Date();
        switch (dateFilter) {
            case 'today':
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(now.getMonth() - 1);
                break;
            case 'year':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
        }
        query = query.where('timestamp', '>=', startDate);

        const snapshot = await query.orderBy('timestamp', 'desc').get();
        displayActivityLog(snapshot.docs);
    } catch (error) {
        console.error('Error loading activity log:', error);
    }
}

// Display activity log
function displayActivityLog(activities) {
    if (!activityList) return;

    activityList.innerHTML = '';
    activities.forEach(doc => {
        const activity = doc.data();
        const activityElement = document.createElement('div');
        activityElement.className = 'activity-item';
        activityElement.innerHTML = `
            <div class="activity-icon">${getActivityIcon(activity.type)}</div>
            <div class="activity-content">
                <div class="activity-title">${activity.title}</div>
                <div class="activity-details">${activity.details}</div>
                <div class="activity-timestamp">${formatTimestamp(activity.timestamp)}</div>
            </div>
        `;
        activityList.appendChild(activityElement);
    });
}

// Helper function to get activity icon
function getActivityIcon(type) {
    switch (type) {
        case 'login':
            return '🔐';
        case 'settings':
            return '⚙️';
        case 'security':
            return '🛡️';
        default:
            return '📝';
    }
}

// Helper function to format timestamp
function formatTimestamp(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleString();
}

// Show success modal
function showSuccessModal(message) {
    const successModal = document.getElementById('successModal');
    const successMessage = document.getElementById('successMessage');
    if (successModal && successMessage) {
        successMessage.textContent = message;
        successModal.style.display = 'block';
    }
}

// Show error modal
function showErrorModal(message) {
    const errorModal = document.getElementById('errorModal');
    const errorMessage = document.getElementById('errorMessage');
    if (errorModal && errorMessage) {
        errorMessage.textContent = message;
        errorModal.style.display = 'block';
    }
}

// Helper function to convert hex color to RGB
function hexToRGB(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : null;
} 