// Onboarding Fix Manager - Ensures onboarding section is always visible
class OnboardingFixManager {
    constructor() {
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.reapplyFix();
        });
        
        // Also reapply fix when onboarding data is loaded
        this.setupDataLoadListener();
    }

    setupDataLoadListener() {
        // Listen for onboarding data load events
        const originalLoadProcesses = window.OnboardingManager?.prototype?.loadProcesses;
        if (originalLoadProcesses) {
            window.OnboardingManager.prototype.loadProcesses = function() {
                const result = originalLoadProcesses.call(this);
                // After data is loaded, ensure section is visible
                setTimeout(() => {
                    window.onboardingFix?.reapplyFix();
                }, 100);
                return result;
            };
        }
    }

    reapplyFix() {
        const onboardingSection = document.getElementById('onboarding-section');
        if (onboardingSection) {
            // Force visibility with multiple approaches
            onboardingSection.classList.remove('hidden');
            onboardingSection.classList.add('show');
            onboardingSection.style.display = 'block';
            onboardingSection.style.opacity = '1';
            onboardingSection.style.transform = 'none';
            onboardingSection.style.visibility = 'visible';

            // Remove any conflicting animation classes that might hide it
            onboardingSection.classList.remove('page-transition');
            onboardingSection.classList.remove('section-fade-in');
            onboardingSection.classList.remove('section-slide-in-right');
            onboardingSection.classList.remove('section-slide-in-left');
            onboardingSection.classList.remove('section-zoom-in');
            
            console.log('OnboardingFixManager: Onboarding visibility ensured.');
            console.log('Onboarding section classes:', onboardingSection.className);
            console.log('Onboarding section style:', onboardingSection.style.cssText);
        }
    }
}

// Initialize the fix manager
window.onboardingFix = new OnboardingFixManager();
