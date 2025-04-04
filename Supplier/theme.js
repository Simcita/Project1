// Function to apply theme and accent color
function applyThemeAndAccentColor() {
    // Get saved theme and accent color from localStorage
    const savedTheme = localStorage.getItem('theme') || 'light';
    const savedAccentColor = localStorage.getItem('accentColor') || '#0056b3';

    // Apply theme
    document.body.classList.toggle('dark-theme', savedTheme === 'dark');

    // Apply accent color to CSS variables
    document.documentElement.style.setProperty('--primary-color', savedAccentColor);
    
    // Apply accent color variations for dark theme
    const accentColorRGB = hexToRGB(savedAccentColor);
    document.documentElement.style.setProperty('--primary-color-light', `rgba(${accentColorRGB}, 0.1)`);
    document.documentElement.style.setProperty('--primary-color-dark', `rgba(${accentColorRGB}, 0.8)`);

    // Apply accent color to specific elements
    applyAccentColorToElements(savedAccentColor);
}

// Function to apply accent color to specific elements
function applyAccentColorToElements(color) {
    // Apply to buttons
    const buttons = document.querySelectorAll('.btn-primary, .btn-secondary');
    buttons.forEach(button => {
        button.style.backgroundColor = color;
        button.style.borderColor = color;
    });

    // Apply to links
    const links = document.querySelectorAll('a');
    links.forEach(link => {
        link.style.color = color;
    });

    // Apply to borders
    const borders = document.querySelectorAll('.border-primary');
    borders.forEach(border => {
        border.style.borderColor = color;
    });

    // Apply to highlights
    const highlights = document.querySelectorAll('.highlight');
    highlights.forEach(highlight => {
        highlight.style.backgroundColor = color;
    });

    // Apply to form elements
    const formElements = document.querySelectorAll('input:focus, select:focus, textarea:focus');
    formElements.forEach(element => {
        element.style.borderColor = color;
        element.style.boxShadow = `0 0 0 2px ${color}40`;
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