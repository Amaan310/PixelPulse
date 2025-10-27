// --- START: FIREBASE INITIALIZATION ---

const firebaseConfig = {
  apiKey: "AIzaSyAj6iTgD2ICrepvjhDJMf_vhCVQ9XGqBDM",
  authDomain: "pixelpulse-4f845.firebaseapp.com",
  projectId: "pixelpulse-4f845",
  storageBucket: "pixelpulse-4f845.firebasestorage.app",
  messagingSenderId: "414281594787",
  appId: "1:414281594787:web:55d217e26687bdf9284c16",
  measurementId: "G-5SBLHNFR0G"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// --- END: FIREBASE INITIALIZATION ---

// Authentication Handler for PixelPulse
// This handles the UI and basic authentication flow

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.init();
  }

  init() {
    // Get modal elements
    this.loginModal = document.getElementById("login-modal");
    this.signupModal = document.getElementById("signup-modal");

    // Get button elements
    this.loginButton = document.getElementById("login-button");
    this.signupButton = document.getElementById("signup-button");
    this.logoutButton = document.getElementById("logout-button");
    this.userDisplay = document.getElementById("user-display");

    // Get close buttons
    const closeButtons = document.querySelectorAll(".auth-modal-close");

    // Get switch buttons
    this.switchToSignup = document.getElementById("switch-to-signup");
    this.switchToLogin = document.getElementById("switch-to-login");

    // Get forms
    this.loginForm = document.getElementById("login-form");
    this.signupForm = document.getElementById("signup-form");

    this.attachEventListeners();
    this.checkAuthStatus();
  }

  attachEventListeners() {
    // Open modals
    this.loginButton?.addEventListener("click", () => this.openLoginModal());
    this.signupButton?.addEventListener("click", () => this.openSignupModal());

    // Close modals
    document.querySelectorAll(".auth-modal-close").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        this.closeModal(e.target.closest(".auth-modal"));
      });
    });

    // Close modal when clicking outside
    window.addEventListener("click", (e) => {
      if (e.target.classList.contains("auth-modal")) {
        this.closeModal(e.target);
      }
    });

    // Switch between modals
    this.switchToSignup?.addEventListener("click", (e) => {
      e.preventDefault();
      this.closeModal(this.loginModal);
      this.openSignupModal();
    });

    this.switchToLogin?.addEventListener("click", (e) => {
      e.preventDefault();
      this.closeModal(this.signupModal);
      this.openLoginModal();
    });

    // Handle form submissions
    this.loginForm?.addEventListener("submit", (e) => this.handleLogin(e));
    this.signupForm?.addEventListener("submit", (e) => this.handleSignup(e));

    // Handle logout
    this.logoutButton?.addEventListener("click", () => this.handleLogout());

    // Social login buttons
    document.querySelectorAll(".google-btn").forEach((btn) => {
      btn.addEventListener("click", () => this.handleSocialLogin("google"));
    });

    document.querySelectorAll(".github-btn").forEach((btn) => {
      btn.addEventListener("click", () => this.handleSocialLogin("github"));
    });
  }

  openLoginModal() {
    this.loginModal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  openSignupModal() {
    this.signupModal.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  closeModal(modal) {
    modal?.classList.remove("active");
    document.body.style.overflow = "";

    // Reset forms
    this.loginForm?.reset();
    this.signupForm?.reset();
  }

  async handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    const remember = e.target.querySelector('input[name="remember"]').checked;

    // Show loading state
    const submitBtn = e.target.querySelector(".auth-submit-btn");
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Logging in...";
    submitBtn.disabled = true;

    try {
      // Simulate API call - Replace with your actual authentication
      await this.simulateAuth(email, password);

      // Store user data
      const user = {
        email: email,
        name: email.split("@")[0],
        loginTime: new Date().toISOString(),
      };

      if (remember) {
        localStorage.setItem("pixelpulse_user", JSON.stringify(user));
      } else {
        sessionStorage.setItem("pixelpulse_user", JSON.stringify(user));
      }

      this.currentUser = user;
      this.updateAuthUI();
      this.closeModal(this.loginModal);

      this.showNotification("Welcome back! Login successful.", "success");
    } catch (error) {
      this.showNotification(
        error.message || "Login failed. Please try again.",
        "error"
      );
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  }

  async handleSignup(e) {
    e.preventDefault();

    const name = document.getElementById("signup-name").value;
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;
    const confirmPassword = document.getElementById(
      "signup-confirm-password"
    ).value;

    // Validate passwords match
    if (password !== confirmPassword) {
      this.showNotification("Passwords do not match!", "error");
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      this.showNotification(
        "Password must be at least 8 characters long.",
        "error"
      );
      return;
    }

    // Show loading state
    const submitBtn = e.target.querySelector(".auth-submit-btn");
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Creating account...";
    submitBtn.disabled = true;

    try {
      // Simulate API call - Replace with your actual authentication
      await this.simulateAuth(email, password);

      // Store user data
      const user = {
        email: email,
        name: name,
        signupTime: new Date().toISOString(),
      };

      localStorage.setItem("pixelpulse_user", JSON.stringify(user));

      this.currentUser = user;
      this.updateAuthUI();
      this.closeModal(this.signupModal);

      this.showNotification(
        "Account created successfully! Welcome to PixelPulse.",
        "success"
      );
    } catch (error) {
      this.showNotification(
        error.message || "Signup failed. Please try again.",
        "error"
      );
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  }

  handleLogout() {
    localStorage.removeItem("pixelpulse_user");
    sessionStorage.removeItem("pixelpulse_user");
    this.currentUser = null;
    this.updateAuthUI();
    this.showNotification("You have been logged out successfully.", "success");
  }

  async handleSocialLogin(provider) {
    let authProvider;

    // Determine which provider to use
    if (provider === "google") {
      authProvider = new firebase.auth.GoogleAuthProvider();
    } else if (provider === "github") {
      authProvider = new firebase.auth.GithubAuthProvider();
    } else {
      return; // Exit if provider is unknown
    }

    try {
      const result = await auth.signInWithPopup(authProvider);
      const user = result.user; 
      const appUser = {
        name: user.displayName,
        email: user.email,
        uid: user.uid, // Unique ID from Firebase
        photoURL: user.photoURL, // Profile picture URL
      };

      // Store the user and update the UI
      localStorage.setItem("pixelpulse_user", JSON.stringify(appUser));
      this.currentUser = appUser;
      this.updateAuthUI();
      this.closeModal(this.loginModal);
      this.closeModal(this.signupModal);

      this.showNotification(`Welcome, ${appUser.name}!`, "success");
    } catch (error) {
      // Handle errors here, such as user closing the popup
      console.error("Authentication Error:", error);
      this.showNotification(`Error: ${error.message}`, "error");
    }
  }

  checkAuthStatus() {
    // Check localStorage first (remember me)
    let userStr = localStorage.getItem("pixelpulse_user");

    // If not in localStorage, check sessionStorage
    if (!userStr) {
      userStr = sessionStorage.getItem("pixelpulse_user");
    }

    if (userStr) {
      try {
        this.currentUser = JSON.parse(userStr);
        this.updateAuthUI();
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem("pixelpulse_user");
        sessionStorage.removeItem("pixelpulse_user");
      }
    }
  }

  updateAuthUI() {
    if (this.currentUser) {
      // User is logged in
      this.loginButton.classList.add("hidden");
      this.signupButton.classList.add("hidden");
      this.logoutButton.classList.remove("hidden");
      this.userDisplay.classList.remove("hidden");
      this.userDisplay.textContent = `Hi, ${this.currentUser.name || "User"}`;
    } else {
      // User is logged out
      this.loginButton.classList.remove("hidden");
      this.signupButton.classList.remove("hidden");
      this.logoutButton.classList.add("hidden");
      this.userDisplay.classList.add("hidden");
    }
  }

  showNotification(message, type = "info") {
    // Create notification element
    const notification = document.createElement("div");
    notification.className = `auth-notification ${type}`;
    notification.textContent = message;

    // Add styles
    notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            background: ${
              type === "success"
                ? "#10b981"
                : type === "error"
                ? "#ef4444"
                : "#3b82f6"
            };
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10001;
            animation: slideInRight 0.3s ease;
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            font-weight: 500;
            max-width: 350px;
        `;

    document.body.appendChild(notification);

    // Auto remove after 4 seconds
    setTimeout(() => {
      notification.style.animation = "slideOutRight 0.3s ease";
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 4000);
  }

  // Simulate authentication - Replace with real API calls
  simulateAuth(email, password) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simple validation for demo
        if (email && password.length >= 8) {
          resolve({ success: true });
        } else {
          reject(
            new Error(
              "Invalid credentials. Password must be at least 8 characters."
            )
          );
        }
      }, 1000);
    });
  }

  // Public method to check if user is authenticated
  isAuthenticated() {
    return this.currentUser !== null;
  }

  // Public method to get current user
  getCurrentUser() {
    return this.currentUser;
  }
}

// Add notification animations to document
const style = document.createElement("style");
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize authentication when DOM is ready
let authManager;
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    authManager = new AuthManager();
  });
} else {
  authManager = new AuthManager();
}
window.authManager = authManager;
