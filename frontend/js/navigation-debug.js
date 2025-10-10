// Navigation Debug Script
function debugNavigation() {
    console.log('=== NAVIGATION DEBUG START ===');
    
    // Check if showSection function exists
    console.log('showSection function exists:', typeof window.showSection);
    console.log('app exists:', typeof window.app);
    
    // Test showSection function directly
    if (typeof window.showSection === 'function') {
        console.log('Testing showSection function...');
        try {
            window.showSection('responsibility-section');
            console.log('showSection executed successfully');
        } catch (error) {
            console.error('Error executing showSection:', error);
        }
    }
    
    // Check all sections
    const sections = document.querySelectorAll('.section');
    console.log('Total sections found:', sections.length);
    
    sections.forEach((section, index) => {
        const id = section.id;
        const isHidden = section.classList.contains('hidden');
        const display = window.getComputedStyle(section).display;
        const opacity = window.getComputedStyle(section).opacity;
        const visibility = window.getComputedStyle(section).visibility;
        
        console.log(`Section ${index + 1}: ${id}`);
        console.log(`  - Hidden class: ${isHidden}`);
        console.log(`  - Display: ${display}`);
        console.log(`  - Opacity: ${opacity}`);
        console.log(`  - Visibility: ${visibility}`);
    });
    
    // Force show responsibility section
    const responsibilitySection = document.getElementById('responsibility-section');
    if (responsibilitySection) {
        console.log('Forcing responsibility section visibility...');
        responsibilitySection.classList.remove('hidden');
        responsibilitySection.style.display = 'block';
        responsibilitySection.style.opacity = '1';
        responsibilitySection.style.visibility = 'visible';
        responsibilitySection.style.position = 'relative';
        responsibilitySection.style.zIndex = '9999';
        responsibilitySection.style.backgroundColor = 'white';
        responsibilitySection.style.minHeight = '100vh';
        responsibilitySection.style.padding = '2rem';
        
        console.log('Responsibility section forced to be visible');
        console.log('New classes:', responsibilitySection.className);
        console.log('New style:', responsibilitySection.style.cssText);
    }
    
    console.log('=== NAVIGATION DEBUG END ===');
}

// Make it globally available
window.debugNavigation = debugNavigation;

// Test navigation on click
document.addEventListener('click', function(e) {
    if (e.target.closest('a[onclick*="responsibility-section"]')) {
        console.log('Responsibility link clicked!');
        setTimeout(() => {
            debugNavigation();
        }, 100);
    }
});

console.log('Navigation debug script loaded. Use debugNavigation() to debug manually.');
