// color-picker.js

const colorDisplay = document.getElementById('color-picker-display');
const pickColorBtn = document.getElementById('pick-color-btn');
const hexValue = document.getElementById('hex-value');
const rgbValue = document.getElementById('rgb-value');
const hslValue = document.getElementById('hsl-value');

// Check if the browser supports the EyeDropper API
if ('EyeDropper' in window) {
    const eyeDropper = new EyeDropper();

    pickColorBtn.addEventListener('click', async () => {
        try {
            // Open the color picker and get the color
            const result = await eyeDropper.open();
            const hexColor = result.sRGBHex;

            hexValue.textContent = hexColor;

            const rgb = hexToRgb(hexColor);

            const rgbColor = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
            console.log(rgbColor);
            colorDisplay.style.backgroundColor = rgbColor;

            const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

            rgbValue.textContent = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
            hslValue.textContent = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
        } catch (error) {
            console.error('Error using EyeDropper:', error);
        }
    });
} else {
    pickColorBtn.disabled = true;
    pickColorBtn.textContent = 'EyeDropper API not supported in this browser';
}

// Helper function: Convert HEX to RGB
function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return { r, g, b };
}

// Helper function: Convert RGB to HSL
function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
    };
}