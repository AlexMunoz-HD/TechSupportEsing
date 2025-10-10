// Onboarding Debug Script - Force visibility and debug
function debugOnboarding() {
    console.log('=== ONBOARDING DEBUG START ===');
    
    const onboardingSection = document.getElementById('onboarding-section');
    if (!onboardingSection) {
        console.error('Onboarding section not found!');
        return;
    }
    
    console.log('Onboarding section found:', onboardingSection);
    console.log('Current classes:', onboardingSection.className);
    console.log('Current style:', onboardingSection.style.cssText);
    console.log('Computed style:', window.getComputedStyle(onboardingSection));
    
    // Force visibility with maximum priority
    onboardingSection.style.setProperty('display', 'block', 'important');
    onboardingSection.style.setProperty('opacity', '1', 'important');
    onboardingSection.style.setProperty('visibility', 'visible', 'important');
    onboardingSection.style.setProperty('transform', 'none', 'important');
    onboardingSection.style.setProperty('position', 'relative', 'important');
    onboardingSection.style.setProperty('z-index', '9999', 'important');
    
    // Remove all possible hiding classes
    const hidingClasses = ['hidden', 'page-transition', 'section-fade-in', 'section-slide-in-right', 'section-slide-in-left', 'section-zoom-in'];
    hidingClasses.forEach(cls => onboardingSection.classList.remove(cls));
    
    // Add show class
    onboardingSection.classList.add('show');
    
    console.log('After forcing visibility:');
    console.log('Classes:', onboardingSection.className);
    console.log('Style:', onboardingSection.style.cssText);
    console.log('Computed display:', window.getComputedStyle(onboardingSection).display);
    console.log('Computed opacity:', window.getComputedStyle(onboardingSection).opacity);
    console.log('Computed visibility:', window.getComputedStyle(onboardingSection).visibility);
    
    // Check if content is there
    const statsCards = onboardingSection.querySelectorAll('.bg-white.rounded-lg.shadow-sm');
    console.log('Stats cards found:', statsCards.length);
    
    const table = onboardingSection.querySelector('#onboardingTableBody');
    console.log('Table body found:', !!table);
    
    console.log('=== ONBOARDING DEBUG END ===');
}

// Make it globally available
window.debugOnboarding = debugOnboarding;

// Auto-run debug when onboarding section is shown
const originalShowSection = window.showSection;
window.showSection = function(sectionId) {
    const result = originalShowSection(sectionId);
    if (sectionId === 'onboarding-section') {
        setTimeout(() => {
            console.log('Auto-running onboarding debug...');
            debugOnboarding();
        }, 100);
    }
    return result;
};

console.log('Onboarding debug script loaded. Use debugOnboarding() to debug manually.');
