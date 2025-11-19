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
                    'Content-Type': 'application/json; charset=utf-8',
                    'Accept': 'application/json; charset=utf-8',
                },
                body: JSON.stringify({ email, password })
            });

            // Ensure UTF-8 decoding
            const text = await response.text();
            const data = JSON.parse(text);

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
            'Content-Type': 'application/json; charset=utf-8',
            'Accept': 'application/json; charset=utf-8',
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
            // Redirect to login instead of reload
            window.location.href = '/';
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

            // Ensure UTF-8 decoding
            const text = await response.text();
            const data = JSON.parse(text);

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
            // Ensure UTF-8 decoding
            const text = await response.text();
            const data = JSON.parse(text);

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
            loginButton.innerHTML = `
                <div class="flex items-center justify-center">
                    <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Iniciando sesión...
                </div>
            `;
            loginSpinner.classList.remove('hidden');
            loginError.classList.add('hidden');

            try {
                console.log('🔐 Attempting login...');
                await auth.login(email, password);
                
                // Show success animation
                showLoginSuccessAnimation();
                
            } catch (error) {
                // Show error
                const loginErrorText = document.getElementById('loginErrorText');
                if (loginErrorText) {
                    loginErrorText.textContent = error.message;
                } else {
                    loginError.textContent = error.message;
                }
                loginError.classList.remove('hidden');
                
                // Reset button state
                loginButton.innerHTML = `
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                    </svg>
                    Iniciar Sesión
                `;
                loginSpinner.classList.add('hidden');
            }
        });
    }
});

// Logout function
async function logout() {
    try {
        await auth.logout();
        
        // Reset login form and button state
        resetLoginForm();
        
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

// Reset login form to initial state
function resetLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const loginButton = document.getElementById('loginButtonText');
    const loginSpinner = document.getElementById('loginSpinner');
    const loginError = document.getElementById('loginError');
    
    if (loginForm) {
        // Clear form fields
        const emailField = document.getElementById('email');
        const passwordField = document.getElementById('password');
        
        if (emailField) emailField.value = '';
        if (passwordField) passwordField.value = '';
        
        // Reset button to initial state
        if (loginButton) {
            loginButton.innerHTML = `
                <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                </svg>
                Iniciar Sesión
            `;
        }
        
        // Hide spinner and error
        if (loginSpinner) loginSpinner.classList.add('hidden');
        if (loginError) loginError.classList.add('hidden');
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

// Bandera para evitar múltiples inicializaciones
let appInitialized = false;

// Initialize app based on authentication status
function initializeApp() {
    // Evitar múltiples inicializaciones
    if (appInitialized) {
        console.log('⏸️ App ya inicializada, ignorando llamada duplicada');
        return;
    }
    
    appInitialized = true;
    console.log('🚀 Inicializando app...');
    
    if (auth.isAuthenticated()) {
        
        // User is logged in, show dashboard
        document.getElementById('loadingScreen').classList.add('hidden');
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        
        // CRITICAL: Show the dashboard-section
        const dashboardSection = document.getElementById('dashboard-section');
        if (dashboardSection) {
            dashboardSection.classList.remove('hidden');
            dashboardSection.style.display = 'block';
        } else {
            console.error('❌ Dashboard section not found!');
        }
        
        // Update user info in header
        updateUserInfo();
        
        // Disparar evento de autenticación para que otros módulos se inicialicen
        window.dispatchEvent(new Event('userAuthenticated'));
        
        // Initialize dashboard after a short delay to ensure auth is ready
        setTimeout(() => {
            initializeDashboard();
        }, 100);
        
    } else {
        
        // User is not logged in, show login screen
        document.getElementById('loadingScreen').classList.add('hidden');
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('dashboard').classList.add('hidden');
        
        // Reset login form to ensure clean state
        resetLoginForm();
        
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
        const dashboardTitle = document.getElementById('dashboardTitle');
        
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

        // Update dashboard title with user name
        if (dashboardTitle) {
            dashboardTitle.textContent = `¡Hola, ${auth.user.full_name}!`;
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

// Show login success animation
function showLoginSuccessAnimation() {
    const animation = document.getElementById('loginSuccessAnimation');
    if (!animation) return;
    
    // Show animation
    animation.classList.add('show');
    
    // After animation completes, redirect to dashboard
    setTimeout(() => {
        // Reset la bandera para permitir reinicialización después del login
        appInitialized = false;
        
        // Hide login screen and show dashboard
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        
        // CRITICAL: Show the dashboard-section immediately
        const dashboardSection = document.getElementById('dashboard-section');
        if (dashboardSection) {
            dashboardSection.classList.remove('hidden');
            dashboardSection.style.display = 'block';
        }
        
        // Update user info in header
        updateUserInfo();
        
        // Disparar evento de autenticación para que otros módulos se inicialicen
        window.dispatchEvent(new Event('userAuthenticated'));
        
        // Reinicializar app (que inicializará el dashboard)
        initializeApp();
        
        // Hide animation after dashboard is ready
        setTimeout(() => {
            animation.classList.remove('show');
        }, 500);
        
    }, 1500); // Show animation for 1.5 seconds
}
