const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Create a simple SVG icon
const svgIcon = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2563eb;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="51.2" ry="51.2" fill="url(#bg)"/>
  <text x="256" y="320" text-anchor="middle" font-family="Arial, sans-serif" font-size="200" font-weight="bold" fill="white">CV</text>
</svg>
`;

// Save SVG
fs.writeFileSync(path.join(__dirname, 'public', 'icon.svg'), svgIcon);

// Generate different sizes
const sizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  try {
    for (const size of sizes) {
      await sharp(Buffer.from(svgIcon))
        .resize(size, size)
        .png()
        .toFile(path.join(__dirname, 'public', `icon-${size}x${size}.png`));
      
      console.log(`Generated icon-${size}x${size}.png`);
    }
    
    // Generate favicon.ico (16x16)
    await sharp(Buffer.from(svgIcon))
      .resize(16, 16)
      .png()
      .toFile(path.join(__dirname, 'public', 'favicon.png'));
    
    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons();