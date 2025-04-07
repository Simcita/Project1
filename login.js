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
const auth = firebase.auth();
const db = firebase.firestore();

// DOM Elements
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const authTabs = document.querySelectorAll('.auth-tab');
const authForms = document.querySelectorAll('.auth-form');
const forgotPasswordLink = document.getElementById('forgotPassword');
const passwordResetModal = document.getElementById('passwordResetModal');
const passwordResetForm = document.getElementById('passwordResetForm');
const closeModalBtn = document.querySelector('.close-btn');
const signupPassword = document.getElementById('signupPassword');
const passwordStrength = document.querySelector('.password-strength');
const logoutButton = document.getElementById('logoutButton');

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    auth.onAuthStateChanged((user) => {
        if (user) {
            // Redirect to dashboard if already logged in
            window.location.href = 'dashboard.html';
        }
    });

    setupEventListeners();
});

function setupEventListeners() {
    // Tab switching
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // Login form submission
    loginForm.addEventListener('submit', handleLogin);

    // Signup form submission
    signupForm.addEventListener('submit', handleSignup);

    // Password reset
    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        passwordResetModal.style.display = 'block';
    });

    passwordResetForm.addEventListener('submit', handlePasswordReset);

    // Close modal
    closeModalBtn.addEventListener('click', () => {
        passwordResetModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === passwordResetModal) {
            passwordResetModal.style.display = 'none';
        }
    });

    // Password strength checker
    signupPassword.addEventListener('input', checkPasswordStrength);
}

// Switch between login and signup tabs
function switchTab(tabId) {
    authTabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.getAttribute('data-tab') === tabId) {
            tab.classList.add('active');
        }
    });

    authForms.forEach(form => {
        form.classList.remove('active');
        if (form.id === `${tabId}Form`) {
            form.classList.add('active');
        }
    });
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    try {
        // Set persistence based on remember me checkbox
        const persistence = rememberMe ? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.SESSION;
        await auth.setPersistence(persistence);

        // Sign in user
        await auth.signInWithEmailAndPassword(email, password);
        
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
    } catch (error) {
        showError(error.message);
    }
}

async function handleLogout() {
    await auth.signOut();
    window.location.href = 'login.html';
}

// Handle signup
async function handleSignup(e) {
    e.preventDefault();

    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const companyName = document.getElementById('companyName').value;
    const businessType = document.getElementById('businessType').value;
    const contactName = document.getElementById('contactName').value;
    const phone = document.getElementById('phone').value;

    // Validate passwords match
    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }

    // Validate required fields
    if (!email || !password || !companyName || !businessType || !contactName || !phone) {
        showError('Please fill in all required fields');
        return;
    }

    try {
        // Create user account
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Create user profile in Firestore with additional fields
        const userData = {
            companyName,
            businessType,
            contactName,
            email,
            phone,
            accountType: 'standard',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'active',
            profileCompleted: true,
            settings: {
                notifications: true,
                emailUpdates: true
            },
            metadata: {
                signupSource: 'web',
                signupDate: new Date().toISOString()
            }
        };

        // Store user data in Firestore
        await db.collection('users').doc(user.uid).set(userData);

        // Create a separate collection for user authentication logs
        await db.collection('userLogs').doc(user.uid).collection('auth').add({
            type: 'signup',
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            ipAddress: '', // This would need to be implemented server-side
            userAgent: navigator.userAgent
        });

        // Send email verification
        await user.sendEmailVerification();

        showSuccess('Account created successfully! Please check your email for verification.');
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);
    } catch (error) {
        console.error('Signup error:', error);
        let errorMessage = 'An error occurred during signup. ';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'This email is already registered. Please use a different email or try logging in.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Please enter a valid email address.';
                break;
            case 'auth/operation-not-allowed':
                errorMessage = 'Email/password accounts are not enabled. Please contact support.';
                break;
            case 'auth/weak-password':
                errorMessage = 'Please choose a stronger password.';
                break;
            default:
                errorMessage += error.message;
        }
        
        showError(errorMessage);
    }
}

// Handle password reset
async function handlePasswordReset(e) {
    e.preventDefault();
    
    const email = document.getElementById('resetEmail').value;

    try {
        await auth.sendPasswordResetEmail(email);
        showSuccess('Password reset email sent. Please check your inbox.');
        passwordResetModal.style.display = 'none';
    } catch (error) {
        showError(error.message);
    }
}

// Check password strength
function checkPasswordStrength() {
    const password = signupPassword.value;
    let strength = 0;

    // Length check
    if (password.length >= 8) strength++;
    
    // Contains number
    if (/\d/.test(password)) strength++;
    
    // Contains lowercase
    if (/[a-z]/.test(password)) strength++;
    
    // Contains uppercase
    if (/[A-Z]/.test(password)) strength++;
    
    // Contains special character
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    // Update strength indicator
    passwordStrength.className = 'password-strength';
    passwordStrength.classList.add(`strength-${strength}`);
}

// Show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    // Remove any existing error messages
    document.querySelectorAll('.error-message').forEach(el => el.remove());
    
    // Add new error message
    document.querySelector('.auth-container').insertBefore(errorDiv, document.querySelector('.auth-tabs'));
    
    // Remove error after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Show success message
function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    // Remove any existing success messages
    document.querySelectorAll('.success-message').forEach(el => el.remove());
    
    // Add new success message
    document.querySelector('.auth-container').insertBefore(successDiv, document.querySelector('.auth-tabs'));
    
    // Remove success message after 5 seconds
    setTimeout(() => {
        successDiv.remove();
    }, 5000);
} 