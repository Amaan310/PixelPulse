// --- START: FIREBASE INITIALIZATION ---
// TODO: Make sure your Firebase config keys are correct.
const firebaseConfig = {
    apiKey: "AIzaSyAj6iTgD2ICrepvjhDJMf_vhCVQ9XGqBDM",
    authDomain: "pixelpulse-4f845.firebaseapp.com",
    projectId: "pixelpulse-4f845",
    storageBucket: "pixelpulse-4f845.appspot.com",
    messagingSenderId: "414281594787",
    appId: "1:414281594787:web:55d217e26687bdf9284c16",
    measurementId: "G-5SBLHNFR0G"
};

// Initialize Firebase and Auth services
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
// --- END: FIREBASE INITIALIZATION ---


// Authentication Handler for PixelPulse
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Modal elements
        this.loginModal = document.getElementById('login-modal');
        this.signupModal = document.getElementById('signup-modal');

        // Button elements
        this.loginButton = document.getElementById('login-button');
        this.signupButton = document.getElementById('signup-button');
        this.logoutButton = document.getElementById('logout-button');
        this.userDisplay = document.getElementById('user-display');

        // Switch links
        this.switchToSignup = document.getElementById('switch-to-signup');
        this.switchToLogin = document.getElementById('switch-to-login');

        // Forms
        this.loginForm = document.getElementById('login-form');
        this.signupForm = document.getElementById('signup-form');

        this.attachEventListeners();
        this.checkAuthState(); // Use Firebase's real-time auth state checker
    }

    attachEventListeners() {
        // Open modals
        this.loginButton?.addEventListener('click', () => this.openLoginModal());
        this.signupButton?.addEventListener('click', () => this.openSignupModal());

        // Close modals
        document.querySelectorAll('.auth-modal-close').forEach(btn => {
            btn.addEventListener('click', (e) => this.closeModal(e.target.closest('.auth-modal')));
        });
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('auth-modal')) this.closeModal(e.target);
        });

        // Switch between modals
        this.switchToSignup?.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeModal(this.loginModal);
            this.openSignupModal();
        });
        this.switchToLogin?.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeModal(this.signupModal);
            this.openLoginModal();
        });

        // Handle form submissions
        this.loginForm?.addEventListener('submit', (e) => this.handleLogin(e));
        this.signupForm?.addEventListener('submit', (e) => this.handleSignup(e));

        // Handle logout
        this.logoutButton?.addEventListener('click', () => this.handleLogout());

        // Social login buttons
        document.querySelectorAll('.google-btn').forEach(btn => btn.addEventListener('click', () => this.handleSocialLogin('google')));
        document.querySelectorAll('.github-btn').forEach(btn => btn.addEventListener('click', () => this.handleSocialLogin('github')));
    }

    openLoginModal() {
        this.loginModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    openSignupModal() {
        this.signupModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeModal(modal) {
        modal?.classList.remove('active');
        document.body.style.overflow = '';
        this.loginForm?.reset();
        this.signupForm?.reset();
    }

    // THIS FUNCTION NOW USES THE REAL FIREBASE LOGIN
    async handleLogin(e) {
        e.preventDefault();
        const email = this.loginForm.email.value;
        const password = this.loginForm.password.value;
        const submitBtn = this.loginForm.querySelector('.auth-submit-btn');
        this.setLoadingState(submitBtn, true, 'Logging in...');

        try {
            await auth.signInWithEmailAndPassword(email, password);
            // Auth state listener will handle UI updates
            this.closeModal(this.loginModal);
            this.showNotification('Welcome back!', 'success');
        } catch (error) {
            this.showNotification(error.message, 'error');
        } finally {
            this.setLoadingState(submitBtn, false, 'Login');
        }
    }

    // THIS FUNCTION NOW USES THE REAL FIREBASE SIGN UP
    async handleSignup(e) {
        e.preventDefault();
        const name = this.signupForm.name.value;
        const email = this.signupForm.email.value;
        const password = this.signupForm.password.value;
        const confirmPassword = this.signupForm['confirm-password'].value;
        const submitBtn = this.signupForm.querySelector('.auth-submit-btn');

        if (password !== confirmPassword) {
            return this.showNotification('Passwords do not match!', 'error');
        }

        this.setLoadingState(submitBtn, true, 'Creating account...');
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            await userCredential.user.updateProfile({ displayName: name });
            // Auth state listener will handle UI updates
            this.closeModal(this.signupModal);
            this.showNotification(`Welcome, ${name}! Account created.`, 'success');
        } catch (error) {
            this.showNotification(error.message, 'error');
        } finally {
            this.setLoadingState(submitBtn, false, 'Create Account');
        }
    }

    // THIS IS THE REAL FIREBASE SOCIAL LOGIN
    async handleSocialLogin(providerName) {
        const provider = providerName === 'google'
            ? new firebase.auth.GoogleAuthProvider()
            : new firebase.auth.GithubAuthProvider();
        
        try {
            await auth.signInWithPopup(provider);
            // Auth state listener handles UI updates and success message
            this.closeModal(this.loginModal);
            this.closeModal(this.signupModal);
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    // THIS IS THE REAL FIREBASE LOGOUT
    async handleLogout() {
        try {
            await auth.signOut();
            // Auth state listener handles UI updates
            this.showNotification('You have been logged out.', 'success');
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    // THIS IS THE MODERN, REAL-TIME FIREBASE AUTH CHECKER
    checkAuthState() {
        auth.onAuthStateChanged(user => {
            if (user) {
                // User is signed in
                this.currentUser = {
                    name: user.displayName,
                    email: user.email,
                    uid: user.uid,
                    photoURL: user.photoURL
                };
                localStorage.setItem('pixelpulse_user', JSON.stringify(this.currentUser));
            } else {
                // User is signed out
                this.currentUser = null;
                localStorage.removeItem('pixelpulse_user');
            }
            this.updateAuthUI();
        });
    }

    updateAuthUI() {
        if (this.currentUser) {
            this.loginButton.classList.add('hidden');
            this.signupButton.classList.add('hidden');
            this.logoutButton.classList.remove('hidden');
            this.userDisplay.classList.remove('hidden');
            this.userDisplay.textContent = `Hi, ${this.currentUser.name || 'User'}`;
        } else {
            this.loginButton.classList.remove('hidden');
            this.signupButton.classList.remove('hidden');
            this.logoutButton.classList.add('hidden');
            this.userDisplay.classList.add('hidden');
        }
    }
    
    setLoadingState(button, isLoading, text) {
        button.disabled = isLoading;
        button.textContent = text;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `auth-notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px; padding: 16px 24px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10001; animation: slideInRight 0.3s ease; font-family: 'Inter', sans-serif;
            font-size: 14px; font-weight: 500; max-width: 350px;
        `;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease forwards';
            notification.addEventListener('animationend', () => notification.remove());
        }, 4000);
    }
}

// Add notification animations to the document
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight { from { transform: translateX(120%); } to { transform: translateX(0); } }
    @keyframes slideOutRight { from { transform: translateX(0); } to { transform: translateX(120%); } }
`;
document.head.appendChild(style);

// Initialize AuthManager when DOM is ready
let authManager;
document.addEventListener('DOMContentLoaded', () => {
    authManager = new AuthManager();
    window.authManager = authManager;
});