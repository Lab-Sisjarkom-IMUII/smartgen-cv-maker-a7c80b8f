const sharp = require('sharp');
const path = require('path');

// Create screenshot placeholders
const createScreenshot = async (width, height, filename) => {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#f8fafc"/>
      <rect x="0" y="0" width="${width}" height="60" fill="#2563eb"/>
      <text x="${width/2}" y="35" text-anchor="middle" font-family="Arial" font-size="20" fill="white" font-weight="bold">SmartGen CV Maker</text>
      
      <rect x="20" y="80" width="${width-40}" height="40" rx="8" fill="#e2e8f0"/>
      <text x="${width/2}" y="105" text-anchor="middle" font-family="Arial" font-size="16" fill="#64748b">AI-Powered Resume Builder</text>
      
      <rect x="20" y="140" width="${(width-60)/3}" height="100" rx="8" fill="#ddd6fe"/>
      <text x="${20 + (width-60)/6}" y="195" text-anchor="middle" font-family="Arial" font-size="14" fill="#5b21b6">Templates</text>
      
      <rect x="${20 + (width-60)/3 + 20}" y="140" width="${(width-60)/3}" height="100" rx="8" fill="#fef3c7"/>
      <text x="${20 + (width-60)/3 + 20 + (width-60)/6}" y="195" text-anchor="middle" font-family="Arial" font-size="14" fill="#92400e">AI Chat</text>
      
      <rect x="${20 + 2*(width-60)/3 + 40}" y="140" width="${(width-60)/3}" height="100" rx="8" fill="#dcfce7"/>
      <text x="${20 + 2*(width-60)/3 + 40 + (width-60)/6}" y="195" text-anchor="middle" font-family="Arial" font-size="14" fill="#166534">Preview</text>
    </svg>
  `;

  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(__dirname, 'public', filename));
  
  console.log(`Generated ${filename}`);
};

// Generate screenshots
createScreenshot(1280, 720, 'screenshot-wide.png');
createScreenshot(640, 1136, 'screenshot-narrow.png');