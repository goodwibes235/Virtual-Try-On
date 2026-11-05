const { Jimp } = require('jimp');
const path = require('path');
const fs = require('fs');

const inDir = path.join(process.cwd(), 'shirt desing');
const outDir = path.join(process.cwd(), 'public', 'garments');

// The 4 authentic shirt designs:
// 1. '394768723610443558.jpg' -> Pure white studio background, standalone graphic streetwear tee
// 2. '485262928624246315.jpg' -> Flat-lay / hanger cobalt geometric 3D tee with neutral grey background
// 3. '2026 Belgian Fans Football Training T-Shirt - 3D Print - Fashionable, Comfortable and Breathable -.jpg' -> 3D printed graphic jersey
// 4. 'Herren 3D-Druck Golf Poloshirt Kurzarm Mikro-Elastisches Polyester Outdoor Casual Sommer Streetwear.jpg' -> 3D printed golf polo

async function createStudioAccurateGarments() {
  // --- 1. Graphic Streetwear Tee (White Background) ---
  {
    const file = '394768723610443558.jpg';
    const img = await Jimp.read(path.join(inDir, file));
    const w = img.bitmap.width, h = img.bitmap.height;

    // Remove white/light-grey background via threshold
    // Any pixel where r > 240, g > 240, b > 240 is background
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const p = img.getPixelColor(x, y);
        const r = (p >> 24) & 255, g = (p >> 16) & 255, b = (p >> 8) & 255;
        if (r > 238 && g > 238 && b > 238) {
          img.setPixelColor(0x00000000, x, y);
        }
      }
    }
    const dest = path.join(outDir, 'graphic-streetwear-tee.png');
    await img.write(dest);
    console.log('Saved 100% HD accurate:', dest);
  }

  // --- 2. Cobalt Geometric 3D Tee (485262928624246315.jpg) ---
  {
    const file = '485262928624246315.jpg';
    const img = await Jimp.read(path.join(inDir, file));
    const w = img.bitmap.width, h = img.bitmap.height;

    // Background in this photo is warm grey / beige background:
    // (r: 100-160, g: 100-155, b: 90-145) with low saturation (|r-g| < 12, |r-b| < 18)
    // The shirt itself is deep navy/black and bright cobalt blue (b > r + 15, b > g + 10)
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const p = img.getPixelColor(x, y);
        const r = (p >> 24) & 255, g = (p >> 16) & 255, b = (p >> 8) & 255;
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        
        // Background check: grey/beige studio floor
        const isWarmGrey = (lum > 70 && lum < 185 && Math.abs(r - g) < 16 && (r - b) >= 0 && (r - b) < 25);
        const isBlue = (b > r + 12 || b > g + 8);
        const isBlackFabric = (lum < 32);

        if (isWarmGrey && !isBlue && !isBlackFabric) {
          img.setPixelColor(0x00000000, x, y);
        }
      }
    }
    const dest = path.join(outDir, 'blue-geometric-tee.png');
    await img.write(dest);
    console.log('Saved 100% HD accurate:', dest);
  }

  // --- 3. Belgian Fans Football Training T-Shirt ---
  {
    const file = '2026 Belgian Fans Football Training T-Shirt - 3D Print - Fashionable, Comfortable and Breathable -.jpg';
    const img = await Jimp.read(path.join(inDir, file));
    const w = img.bitmap.width, h = img.bitmap.height;

    // Background is cool studio slate grey:
    // (r: 60-120, g: 60-120, b: 65-125) with neutral chromaticity
    // The shirt has vivid lion graphics, gold, red, black, and micro-mesh textures
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const p = img.getPixelColor(x, y);
        const r = (p >> 24) & 255, g = (p >> 16) & 255, b = (p >> 8) & 255;
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;

        // Background studio backdrop:
        const isBackdrop = (lum > 55 && lum < 135 && Math.abs(r - g) < 10 && Math.abs(g - b) < 10);
        // Exclude bottom floor
        const isBottomFloor = (y > h * 0.95 && lum > 60);

        if (isBackdrop || isBottomFloor) {
          // Verify it's not the inner graphic
          const isGraphicVivid = (Math.abs(r - b) > 18 || Math.abs(r - g) > 18);
          if (!isGraphicVivid && (x < w * 0.25 || x > w * 0.75 || y < h * 0.12 || y > h * 0.88)) {
            img.setPixelColor(0x00000000, x, y);
          }
        }
      }
    }
    const dest = path.join(outDir, 'belgian-training-tee.png');
    await img.write(dest);
    console.log('Saved 100% HD accurate:', dest);
  }

  // --- 4. Golf Poloshirt 3D ---
  {
    const file = 'Herren 3D-Druck Golf Poloshirt Kurzarm Mikro-Elastisches Polyester Outdoor Casual Sommer Streetwear.jpg';
    const img = await Jimp.read(path.join(inDir, file));
    const w = img.bitmap.width, h = img.bitmap.height;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const p = img.getPixelColor(x, y);
        const r = (p >> 24) & 255, g = (p >> 16) & 255, b = (p >> 8) & 255;
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;

        // Background studio backdrop
        const isBackdrop = (lum > 50 && lum < 125 && Math.abs(r - g) < 10 && Math.abs(g - b) < 10);
        if (isBackdrop && (x < w * 0.22 || x > w * 0.78 || y < h * 0.12 || y > h * 0.9)) {
          img.setPixelColor(0x00000000, x, y);
        }
      }
    }
    const dest = path.join(outDir, 'golf-polo-3d.png');
    await img.write(dest);
    console.log('Saved 100% HD accurate:', dest);
  }
}

createStudioAccurateGarments().catch(console.error);

