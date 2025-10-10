// Dashboard Initialization Fix
class DashboardFix {
    constructor() {
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.fixDashboard());
        } else {
            this.fixDashboard();
        }
    }

    fixDashboard() {
        // Ensure dashboard section is visible
        const dashboardSection = document.getElementById('dashboard-section');
        if (dashboardSection) {
            dashboardSection.style.opacity = '1';
            dashboardSection.style.transform = 'none';
            dashboardSection.classList.remove('page-transition');
            dashboardSection.classList.add('show');
        }

        // Ensure dashboard cards are visible
        const dashboardCards = document.querySelectorAll('#dashboard-section .bg-white');
        dashboardCards.forEach(card => {
            card.style.opacity = '1';
            card.style.transform = 'none';
            card.classList.remove('page-transition');
        });

        // Remove any conflicting classes from dashboard elements
        const dashboardElements = document.querySelectorAll('#dashboard-section *');
        dashboardElements.forEach(element => {
            element.classList.remove('page-transition');
            if (element.style.opacity === '0') {
                element.style.opacity = '1';
            }
            if (element.style.transform && element.style.transform !== 'none') {
                element.style.transform = 'none';
            }
        });

        console.log('Dashboard fix applied');
    }

    // Method to reapply fix if needed
    reapplyFix() {
        this.fixDashboard();
    }
}

// Initialize dashboard fix
document.addEventListener('DOMContentLoaded', function() {
    window.dashboardFix = new DashboardFix();
});

// Export for global access
window.DashboardFix = DashboardFix;
