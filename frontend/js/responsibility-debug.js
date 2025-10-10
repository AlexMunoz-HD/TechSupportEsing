// Responsibility Letters Debug Script
function debugResponsibility() {
    console.log('=== RESPONSIBILITY DEBUG START ===');
    
    const responsibilitySection = document.getElementById('responsibility-section');
    if (!responsibilitySection) {
        console.error('Responsibility section not found!');
        return;
    }
    
    console.log('Responsibility section found:', responsibilitySection);
    console.log('Current classes:', responsibilitySection.className);
    console.log('Current style:', responsibilitySection.style.cssText);
    
    // Force visibility with maximum priority
    responsibilitySection.style.setProperty('display', 'block', 'important');
    responsibilitySection.style.setProperty('opacity', '1', 'important');
    responsibilitySection.style.setProperty('visibility', 'visible', 'important');
    responsibilitySection.style.setProperty('transform', 'none', 'important');
    responsibilitySection.style.setProperty('position', 'relative', 'important');
    responsibilitySection.style.setProperty('z-index', '9999', 'important');
    responsibilitySection.style.setProperty('background-color', 'white', 'important');
    responsibilitySection.style.setProperty('min-height', '100vh', 'important');
    responsibilitySection.style.setProperty('padding', '2rem', 'important');
    
    // Remove all possible hiding classes
    const hidingClasses = ['hidden', 'page-transition', 'section-fade-in', 'section-slide-in-right', 'section-slide-in-left', 'section-zoom-in'];
    hidingClasses.forEach(cls => responsibilitySection.classList.remove(cls));
    
    // Add show class
    responsibilitySection.classList.add('show');
    
    console.log('After forcing visibility:');
    console.log('Classes:', responsibilitySection.className);
    console.log('Style:', responsibilitySection.style.cssText);
    console.log('Computed display:', window.getComputedStyle(responsibilitySection).display);
    console.log('Computed opacity:', window.getComputedStyle(responsibilitySection).opacity);
    console.log('Computed visibility:', window.getComputedStyle(responsibilitySection).visibility);
    
    // Check if content is there
    const statsCards = responsibilitySection.querySelectorAll('.bg-white.rounded-lg.shadow-sm');
    console.log('Stats cards found:', statsCards.length);
    
    const table = responsibilitySection.querySelector('#responsibilityTableBody');
    console.log('Table body found:', !!table);
    
    // Check if manager exists
    console.log('ResponsibilityManager exists:', !!window.responsibilityManager);
    
    // Try to load data if manager exists
    if (window.responsibilityManager) {
        console.log('Loading responsibility letters...');
        window.responsibilityManager.loadLetters();
    } else {
        console.log('ResponsibilityManager not found, trying to initialize...');
        if (window.ResponsibilityManager) {
            window.responsibilityManager = new window.ResponsibilityManager();
            window.responsibilityManager.loadLetters();
        }
    }
    
    console.log('=== RESPONSIBILITY DEBUG END ===');
}

// Make it globally available
window.debugResponsibility = debugResponsibility;

// Auto-run debug when responsibility section is shown
const originalShowSection = window.showSection;
window.showSection = function(sectionId) {
    const result = originalShowSection(sectionId);
    if (sectionId === 'responsibility-section') {
        setTimeout(() => {
            console.log('Auto-running responsibility debug...');
            debugResponsibility();
        }, 100);
    }
    return result;
};

console.log('Responsibility debug script loaded. Use debugResponsibility() to debug manually.');
