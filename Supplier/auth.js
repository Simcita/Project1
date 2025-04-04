// Firebase Authentication Service
const firebaseConfig = {
    apiKey: "AIzaSyBEGJ8Sfw8nOZCN3wY8YhBtlGVp67tUCcg",
    authDomain: "project-01-fffa5.firebaseapp.com",
    projectId: "project-01-fffa5",
    storageBucket: "project-01-fffa5.firebasestorage.app",
    messagingSenderId: "989869504960",
    appId: "1:989869504960:web:910d5db9f752a21134f025"
  };

// Initialize Firebase if not already initialized
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// Sign up with email and password
async function signUp(email, password, userData) {
    try {
        // Create user with email and password
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Create user profile in Firestore
        await db.collection('profiles').doc(user.uid).set({
            ...userData,
            email: user.email,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
            role: 'customer', // default role
            status: 'active'
        });

        return { success: true, user };
    } catch (error) {
        console.error('Error in signUp:', error);
        throw error;
    }
}

// Sign in with email and password
async function signIn(email, password) {
    try {
        console.log('Starting sign in process for:', email);
        
        // Validate inputs
        if (!email || !password) {
            throw new Error('Email and password are required');
        }

        // Attempt to sign in
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        console.log('Firebase auth successful, user:', userCredential.user.uid);
        
        // Get user profile from Firestore
        const profileDoc = await db.collection('profiles').doc(userCredential.user.uid).get();
        
        if (!profileDoc.exists) {
            console.error('No profile found for user:', userCredential.user.uid);
            throw new Error('User profile not found');
        }
        
        const profileData = profileDoc.data();
        console.log('Profile data retrieved:', profileData);
        
        // Update last login
        await db.collection('profiles').doc(userCredential.user.uid).update({
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        return {
            success: true,
            user: userCredential.user,
            profile: profileData
        };
    } catch (error) {
        console.error('Sign in error:', error);
        let errorMessage = 'An error occurred during login. Please try again.';
        
        if (error.code === 'auth/user-not-found') {
            errorMessage = 'No account found with this email.';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = 'Incorrect password.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email address.';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Too many failed attempts. Please try again later.';
        } else if (error.code === 'auth/network-request-failed') {
            errorMessage = 'Network error. Please check your internet connection.';
        }
        
        return {
            success: false,
            error: errorMessage
        };
    }
}

// Sign out
async function signOut() {
    try {
        await auth.signOut();
        return { success: true };
    } catch (error) {
        console.error('Error in signOut:', error);
        throw error;
    }
}

// Reset password
async function resetPassword(email) {
    try {
        await auth.sendPasswordResetEmail(email);
        return { success: true };
    } catch (error) {
        console.error('Error in resetPassword:', error);
        throw error;
    }
}

// Get current user profile
async function getCurrentUserProfile() {
    const user = auth.currentUser;
    if (!user) return null;

    try {
        const doc = await db.collection('profiles').doc(user.uid).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (error) {
        console.error('Error in getCurrentUserProfile:', error);
        throw error;
    }
}

// Update user profile
async function updateUserProfile(userData) {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');

    try {
        await db.collection('profiles').doc(user.uid).update({
            ...userData,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Error in updateUserProfile:', error);
        throw error;
    }
}

// Check if user is authenticated
function isAuthenticated() {
    return new Promise((resolve) => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            unsubscribe();
            resolve(!!user);
        });
    });
}

// Get current user role
async function getCurrentUserRole() {
    const profile = await getCurrentUserProfile();
    return profile ? profile.role : null;
}

// Auth state observer
function onAuthStateChanged(callback) {
    return auth.onAuthStateChanged(callback);
}

// Export all functions
export {
    signUp,
    signIn,
    signOut,
    resetPassword,
    getCurrentUserProfile,
    updateUserProfile,
    isAuthenticated,
    getCurrentUserRole,
    onAuthStateChanged
}; 