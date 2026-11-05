const { Jimp } = require('jimp');
const path = require('path');

const srcPath = 'C:/Users/Abdul Rehman/.gemini/antigravity/brain/42acefc6-cb61-412f-b6a1-62d88b2f3368/.user_uploaded/media_1793788099243_00af8bb5.jpg';
const outDir = path.join(process.cwd(), 'public', 'garments');

// The uploaded reference image (1024 x 682) contains full-resolution photos of a man wearing all 4 garments!
// Let's accurately crop the worn shirts from the model at 1:1 original clarity:
// Quadrant 1 (Top Left): Man wearing Black Oversized Tee (center ~ x:265, y:220)
// Quadrant 2 (Top Right): Man wearing White Regular Tee (center ~ x:770, y:220)
// Quadrant 3 (Bottom Left): Man wearing Navy Polo Shirt (center ~ x:265, y:560)
// Quadrant 4 (Bottom Right): Man wearing Green Shirt (center ~ x:770, y:560)

async function extractWornGarmentsWithFolds() {
  const img = await Jimp.read(srcPath);

  const targets = [
    {
      name: 'black-oversized-photoreal.png',
      // High resolution crop of the actual worn black oversized tee with all natural wrinkles & sleeve folds:
      crop: { x: 155, y: 138, w: 220, h: 185 },
      cleanThreshold: (r, g, b, x, y, w, h) => {
        // Exclude neck/head: center top (x: 85..135, y: 0..25)
        if (y < 22 && x > 85 && x < 135) return false;
        // Exclude hands/wrists at bottom sides
        if (y > 155 && (x < 30 || x > 190)) return false;
        // Background studio wall is grey: r > 180, g > 180, b > 180
        if (r > 160 && g > 160 && b > 160) return false;
        // Black tee fabric has r,g,b in 15..55
        return true;
      },
    },
    {
      name: 'white-regular-photoreal.png',
      crop: { x: 660, y: 140, w: 225, h: 185 },
      cleanThreshold: (r, g, b, x, y, w, h) => {
        // Exclude neck: center top
        if (y < 24 && x > 88 && x < 138) return false;
        // Skin check: r > 160, g > 110, b > 80 and (r - b) > 30
        const isSkin = r > 150 && g > 105 && b > 75 && (r - b) > 28;
        if (isSkin) return false;
        // Studio wall check: uniform grey
        const isWall = r > 195 && g > 195 && b > 195 && Math.abs(r - g) < 8 && Math.abs(g - b) < 8;
        if (isWall) return false;
        // Bottom pants: very dark (r < 60, g < 60, b < 60 at bottom y > 165)
        if (y > 168 && r < 60 && g < 60 && b < 60) return false;
        return true;
      },
    },
    {
      name: 'navy-polo-photoreal.png',
      crop: { x: 165, y: 478, w: 200, h: 185 },
      cleanThreshold: (r, g, b, x, y, w, h) => {
        // Exclude neck & collar opening center
        if (y < 18 && x > 80 && x < 120) return false;
        // Studio grey wall
        if (r > 160 && g > 160 && b > 160) return false;
        // Skin on arms:
        const isSkin = r > 140 && g > 95 && b > 70 && (r - b) > 28;
        if (isSkin && (x < 25 || x > 175)) return false;
        // Black jeans at bottom
        if (y > 165 && r < 50 && g < 50 && b < 50) return false;
        return true;
      },
    },
    {
      name: 'green-shirt-photoreal.png',
      crop: { x: 660, y: 478, w: 215, h: 185 },
      cleanThreshold: (r, g, b, x, y, w, h) => {
        // Exclude neck opening
        if (y < 20 && x > 85 && x < 130) return false;
        // Studio grey wall
        if (r > 160 && g > 160 && b > 160) return false;
        // Skin on hands/forearms
        const isSkin = r > 140 && g > 95 && b > 70 && (r - b) > 28;
        if (isSkin && (x < 20 || x > 195)) return false;
        // Black jeans at bottom
        if (y > 168 && r < 45 && g < 45 && b < 45) return false;
        return true;
      },
    },
  ];

  for (const t of targets) {
    const cropped = img.clone().crop({
      x: t.crop.x,
      y: t.crop.y,
      w: t.crop.w,
      h: t.crop.h,
    });

    // Upscale with bicubic interpolation to 800x670 for ultra-sharp canvas rendering
    cropped.resize({ w: 800, h: 670 });

    const w = cropped.bitmap.width;
    const h = cropped.bitmap.height;

    // Apply alpha transparency mask
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const color = cropped.getPixelColor(x, y);
        const r = (color >> 24) & 255;
        const g = (color >> 16) & 255;
        const b = (color >> 8) & 255;

        const keep = t.cleanThreshold(r, g, b, x, y, w, h);
        if (!keep) {
          cropped.setPixelColor(0x00000000, x, y);
        }
      }
    }

    const dest = path.join(outDir, t.name);
    await cropped.write(dest);
    console.log('Saved photoreal worn garment asset:', dest);
  }
}

extractWornGarmentsWithFolds().catch(console.error);

