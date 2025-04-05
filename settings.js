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
const promotionalEmails = document.getElementById('promotionalEmails');
const twoFactorAuth = document.getElementById('twoFactorAuth');
const languageSelect = document.getElementById('languageSelect');
const currencySelect = document.getElementById('currencySelect');
const saveSettings = document.getElementById('saveSettings');
const resetSettings = document.getElementById('resetSettings');
const viewActivityLog = document.getElementById('viewActivityLog');
const activityLogModal = document.getElementById('activityLogModal');
const activityTypeFilter = document.getElementById('activityTypeFilter');
const activityDateFilter = document.getElementById('activityDateFilter');
const activityList = document.getElementById('activityList');

// Default settings
const defaultSettings = {
    theme: 'light',
    accentColor: '#0056b3',
    emailNotifications: true,
    orderUpdates: true,
    promotionalEmails: false,
    twoFactorAuth: false,
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
    if (promotionalEmails) promotionalEmails.checked = currentSettings.promotionalEmails;
    
    // Apply security settings
    if (twoFactorAuth) twoFactorAuth.checked = currentSettings.twoFactorAuth;
    
    // Apply language and currency
    if (languageSelect) languageSelect.value = currentSettings.language;
    if (currencySelect) currencySelect.value = currentSettings.currency;

    // Save to localStorage for persistence
    localStorage.setItem('theme', currentSettings.theme);
    localStorage.setItem('accentColor', currentSettings.accentColor);
}

// Apply accent color to specific elements
function applyAccentColorToElements(color) {
    // Apply to buttons
    document.querySelectorAll('.btn-primary').forEach(btn => {
        btn.style.backgroundColor = color;
    });
    
    // Apply to links
    document.querySelectorAll('a').forEach(link => {
        link.style.color = color;
    });
    
    // Apply to borders and highlights
    document.querySelectorAll('.sidebar li.active').forEach(item => {
        item.style.borderLeftColor = color;
        item.style.backgroundColor = `rgba(${hexToRGB(color)}, 0.1)`;
    });
    
    // Apply to form elements
    document.querySelectorAll('input:focus, select:focus, textarea:focus').forEach(element => {
        element.style.borderColor = color;
        element.style.boxShadow = `0 0 0 2px rgba(${hexToRGB(color)}, 0.25)`;
    });
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
    [emailNotifications, orderUpdates, promotionalEmails].forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            currentSettings[checkbox.id] = checkbox.checked;
            saveSettingsToFirestore();
        });
    });

    // Two-factor authentication
    twoFactorAuth.addEventListener('change', async () => {
        if (twoFactorAuth.checked) {
            // Implement 2FA setup
            const confirmed = await setupTwoFactorAuth();
            if (!confirmed) {
                twoFactorAuth.checked = false;
                return;
            }
        }
        currentSettings.twoFactorAuth = twoFactorAuth.checked;
        saveSettingsToFirestore();
    });

    // Language and currency
    [languageSelect, currencySelect].forEach(select => {
        select.addEventListener('change', () => {
            currentSettings[select.id.replace('Select', '')] = select.value;
            saveSettingsToFirestore();
        });
    });

    // Save settings button
    saveSettings.addEventListener('click', () => {
        saveSettingsToFirestore();
        showNotification('Settings saved successfully!', 'success');
    });

    // Reset settings button
    resetSettings.addEventListener('click', async () => {
        if (confirm('Are you sure you want to reset all settings to default?')) {
            currentSettings = { ...defaultSettings };
            applySettings();
            await saveSettingsToFirestore();
            showNotification('Settings reset to default', 'success');
        }
    });

    // Activity log
    viewActivityLog.addEventListener('click', () => {
        activityLogModal.style.display = 'block';
        loadActivityLog();
    });

    // Activity log filters
    [activityTypeFilter, activityDateFilter].forEach(filter => {
        filter.addEventListener('change', loadActivityLog);
    });

    // Close modal
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            activityLogModal.style.display = 'none';
        });
    });

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === activityLogModal) {
            activityLogModal.style.display = 'none';
        }
    });
}

// Save settings to Firestore
async function saveSettingsToFirestore() {
    try {
        const user = auth.currentUser;
        if (user) {
            await db.collection('users').doc(user.uid).update({
                settings: currentSettings
            });
        }
    } catch (error) {
        console.error('Error saving settings:', error);
        showNotification('Error saving settings', 'error');
    }
}

// Setup two-factor authentication
async function setupTwoFactorAuth() {
    // This is a placeholder for 2FA setup
    // In a real application, you would implement proper 2FA setup here
    return confirm('Would you like to set up two-factor authentication? This will require additional setup steps.');
}

// Load activity log
async function loadActivityLog() {
    try {
        const user = auth.currentUser;
        if (!user) return;

        let query = db.collection('activityLog')
            .where('userId', '==', user.uid)
            .orderBy('timestamp', 'desc');

        // Apply filters
        const typeFilter = activityTypeFilter.value;
        const dateFilter = activityDateFilter.value;

        if (typeFilter !== 'all') {
            query = query.where('type', '==', typeFilter);
        }

        if (dateFilter) {
            const startDate = new Date(dateFilter);
            const endDate = new Date(dateFilter);
            endDate.setDate(endDate.getDate() + 1);
            query = query.where('timestamp', '>=', startDate)
                        .where('timestamp', '<', endDate);
        }

        const snapshot = await query.get();
        activityList.innerHTML = '';

        if (snapshot.empty) {
            activityList.innerHTML = '<div class="no-activity">No activity found</div>';
            return;
        }

        snapshot.forEach(doc => {
            const activity = doc.data();
            const activityItem = document.createElement('div');
            activityItem.className = 'activity-item';
            activityItem.innerHTML = `
                <div class="activity-icon">${getActivityIcon(activity.type)}</div>
                <div class="activity-details">
                    <div class="activity-title">${activity.title}</div>
                    <div class="activity-description">${activity.description}</div>
                </div>
                <div class="activity-time">${formatTimestamp(activity.timestamp)}</div>
            `;
            activityList.appendChild(activityItem);
        });
    } catch (error) {
        console.error('Error loading activity log:', error);
        activityList.innerHTML = '<div class="error-message">Error loading activity log</div>';
    }
}

// Get activity icon based on type
function getActivityIcon(type) {
    const icons = {
        login: '🔐',
        order: '📦',
        profile: '👤',
        settings: '⚙️'
    };
    return icons[type] || '📝';
}

// Format timestamp
function formatTimestamp(timestamp) {
    if (!timestamp) return '';
    const date = timestamp.toDate();
    return date.toLocaleString();
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Helper function to convert hex color to RGB
function hexToRGB(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : null;
} 