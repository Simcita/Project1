// Function to apply theme and accent color from localStorage
function applyThemeAndAccentColor() {
    // Apply theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.body.classList.toggle('dark-theme', savedTheme === 'dark');
    }

    // Apply accent color
    const savedAccentColor = localStorage.getItem('accentColor');
    if (savedAccentColor) {
        // Apply to CSS variables
        document.documentElement.style.setProperty('--primary-color', savedAccentColor);
        
        // Apply accent color variations
        const accentColorRGB = hexToRGB(savedAccentColor);
        document.documentElement.style.setProperty('--primary-color-light', `rgba(${accentColorRGB}, 0.1)`);
        document.documentElement.style.setProperty('--primary-color-dark', `rgba(${accentColorRGB}, 0.8)`);
        
        // Apply to specific elements
        applyAccentColorToElements(savedAccentColor);
    }
}

// Function to apply accent color to specific elements
function applyAccentColorToElements(color) {
    // Apply to buttons
    document.querySelectorAll('.btn-primary').forEach(btn => {
        btn.style.backgroundColor = color;
    });
    
    // Apply to links
    document.querySelectorAll('a').forEach(link => {
        link.style.color = color;
    });
    
    // Apply to borders and highlights
    document.querySelectorAll('.sidebar li.active').forEach(item => {
        item.style.borderLeftColor = color;
        item.style.backgroundColor = `rgba(${hexToRGB(color)}, 0.1)`;
    });
    
    // Apply to form elements
    document.querySelectorAll('input:focus, select:focus, textarea:focus').forEach(element => {
        element.style.borderColor = color;
        element.style.boxShadow = `0 0 0 2px rgba(${hexToRGB(color)}, 0.25)`;
    });
}

// Helper function to convert hex color to RGB
function hexToRGB(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : null;
}

// Apply theme and accent color when the page loads
document.addEventListener('DOMContentLoaded', applyThemeAndAccentColor);

// Listen for theme changes from other pages
window.addEventListener('storage', (e) => {
    if (e.key === 'theme' || e.key === 'accentColor') {
        applyThemeAndAccentColor();
    }
}); 