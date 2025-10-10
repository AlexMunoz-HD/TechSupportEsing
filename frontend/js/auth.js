// Authentication module
class Auth {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user') || 'null');
        this.apiBase = '/api';
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.token && this.user;
    }
    // Login function
    async login(email, password) {
        try {
            const response = await fetch(`${this.apiBase}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // Store token and user data
            this.token = data.token;
            this.user = data.user;
            localStorage.setItem('token', this.token);
            localStorage.setItem('user', JSON.stringify(this.user));

            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    // Logout function
    async logout() {
        try {
            if (this.token) {
                await fetch(`${this.apiBase}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json',
                    }
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear local storage regardless of API call success
            this.token = null;
            this.user = null;
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    }

    // Get authorization header
    getAuthHeader() {
        return this.token ? { 'Authorization': `Bearer ${this.token}` } : {};
    }

    // Make authenticated API request
    async apiRequest(url, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...this.getAuthHeader(),
            ...options.headers
        };

        const response = await fetch(`${this.apiBase}${url}`, {
            ...options,
            headers
        });

        if (response.status === 401) {
            // Token expired or invalid
            await this.logout();
            window.location.reload();
            return;
        }

        return response;
    }

    // Change password
    async changePassword(currentPassword, newPassword) {
        try {
            const response = await this.apiRequest('/auth/change-password', {
                method: 'POST',
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Password change failed');
            }

            return data;
        } catch (error) {
            console.error('Change password error:', error);
            throw error;
        }
    }

    // Get user profile
    async getProfile() {
        try {
            const response = await this.apiRequest('/auth/profile');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to get profile');
            }

            this.user = data.user;
            localStorage.setItem('user', JSON.stringify(this.user));
            return data.user;
        } catch (error) {
            console.error('Get profile error:', error);
            throw error;
        }
    }
}

// Initialize auth instance
const auth = new Auth();
window.auth = auth; // Make auth globally available

// Login form handler
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const loginButton = document.getElementById('loginButtonText');
    const loginSpinner = document.getElementById('loginSpinner');
    const loginError = document.getElementById('loginError');

    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            // Show loading state
            loginButton.textContent = 'Logging in...';
            loginSpinner.classList.remove('hidden');
            loginError.classList.add('hidden');

            try {
                await auth.login(email, password);
                
                // Hide login screen and show dashboard
                document.getElementById('loginScreen').classList.add('hidden');
                document.getElementById('dashboard').classList.remove('hidden');
                
                // Initialize dashboard
                initializeDashboard();
                
            } catch (error) {
                // Show error
                loginError.textContent = error.message;
                loginError.classList.remove('hidden');
                
                // Reset button state
                loginButton.textContent = 'Login';
                loginSpinner.classList.add('hidden');
            }
        });
    }
});

// Logout function
async function logout() {
    try {
        await auth.logout();
        // Show login screen and hide dashboard
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('dashboard').classList.add('hidden');
        
        // Clear any active notifications
        clearNotifications();
    } catch (error) {
        console.error('Logout error:', error);
        // Force reload even if API call fails
        window.location.reload();
    }
}

// Change password function
async function changePassword() {
    const currentPassword = prompt('Ingresa tu contraseña actual:');
    if (!currentPassword) return;

    const newPassword = prompt('Ingresa tu nueva contraseña:');
    if (!newPassword) return;

    const confirmPassword = prompt('Confirma tu nueva contraseña:');
    if (newPassword !== confirmPassword) {
        alert('Las contraseñas no coinciden');
        return;
    }

    try {
        await auth.changePassword(currentPassword, newPassword);
        alert('Contraseña cambiada exitosamente');
    } catch (error) {
        alert('Error al cambiar contraseña: ' + error.message);
    }
}

// Initialize app based on authentication status
function initializeApp() {
    if (auth.isAuthenticated()) {
        // User is logged in, show dashboard
        document.getElementById('loadingScreen').classList.add('hidden');
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        
        // Update user info in header
        updateUserInfo();
        
        // Initialize dashboard after a short delay to ensure auth is ready
        setTimeout(() => {
            console.log('Initializing dashboard after auth is ready...');
            initializeDashboard();
        }, 100);
    } else {
        // User is not logged in, show login screen
        document.getElementById('loadingScreen').classList.add('hidden');
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('dashboard').classList.add('hidden');
    }
}

// Update user info in header
function updateUserInfo() {
    if (auth.user) {
        const userName = document.getElementById('userName');
        const userInitials = document.getElementById('userInitials');
        const userFullName = document.getElementById('userFullName');
        const userEmail = document.getElementById('userEmail');
        const adminSection = document.getElementById('adminSection');
        
        if (userName) {
            userName.textContent = auth.user.full_name;
        }
        
        if (userInitials) {
            const initials = auth.user.full_name
                .split(' ')
                .map(name => name[0])
                .join('')
                .toUpperCase();
            userInitials.textContent = initials;
        }

        if (userFullName) {
            userFullName.textContent = auth.user.full_name;
        }

        if (userEmail) {
            userEmail.textContent = auth.user.email;
        }

        // Show/hide admin section based on user role
        if (adminSection) {
            if (auth.user.role === 'admin') {
                adminSection.classList.remove('hidden');
            } else {
                adminSection.classList.add('hidden');
            }
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Hide loading screen after a short delay
    setTimeout(() => {
        initializeApp();
    }, 1000);
});
