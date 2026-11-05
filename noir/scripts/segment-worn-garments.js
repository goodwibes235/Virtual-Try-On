const { Jimp } = require('jimp');
const path = require('path');

const srcPath = 'C:/Users/Abdul Rehman/.gemini/antigravity/brain/42acefc6-cb61-412f-b6a1-62d88b2f3368/.user_uploaded/media_1793788099243_00af8bb5.jpg';
const outDir = path.join(process.cwd(), 'public', 'garments');

// Image is 1024 x 682
// 4 quadrants:
// Top-Left (0..512 x, 0..341 y): Man wearing Black Oversized Tee
// Top-Right (512..1024 x, 0..341 y): Man wearing White Regular Tee
// Bottom-Left (0..512 x, 341..682 y): Man wearing Navy Polo Shirt
// Bottom-Right (512..1024 x, 341..682 y): Man wearing Green Shirt

async function segmentGarmentsFromMan() {
  const img = await Jimp.read(srcPath);

  // Background wall in the photo is a studio neutral grey:
  // RGB around (200, 200, 203) to (218, 218, 222)
  // Model's skin (neck & arms):
  // R is usually significantly higher than B (e.g. R: 180-220, G: 130-170, B: 100-140)
  // Model's pants are black/dark grey at the bottom (y > ~310 in top row, y > ~650 in bottom row)

  const items = [
    {
      id: 'black-oversized',
      name: 'black-tee-worn.png',
      // The shirt region on the man in top-left quadrant:
      crop: { x: 155, y: 135, w: 220, h: 180 },
      // Black shirt: R < 60, G < 60, B < 65
      isGarment: (r, g, b) => r < 65 && g < 65 && b < 70,
    },
    {
      id: 'white-regular',
      name: 'white-tee-worn.png',
      // The shirt region on the man in top-right quadrant:
      crop: { x: 665, y: 140, w: 215, h: 175 },
      // White shirt: R > 190, G > 185, B > 185, but skin has high R/B ratio, bg wall is grey (r~=g~=b~210)
      // On the shirt: fabric highlights and texture are #F5F3EF to #E8E5E0
      isGarment: (r, g, b, x, y) => {
        // Exclude neck (center top)
        if (y < 25 && x > 75 && x < 140) return false;
        // Exclude arms (sides)
        const isSkin = (r > 160 && g > 110 && b > 80 && (r - b) > 35);
        if (isSkin) return false;
        // Background wall is smooth grey
        return r > 165 && g > 160 && b > 160;
      },
    },
    {
      id: 'navy-polo',
      name: 'navy-polo-worn.png',
      // Bottom-left quadrant:
      crop: { x: 165, y: 475, w: 200, h: 175 },
      // Navy polo: deep blue R < 55, G < 65, B: 50..110, B > R
      isGarment: (r, g, b) => (b > r || b > g) && r < 75 && g < 85 && b < 130 && (r + g + b) > 30,
    },
    {
      id: 'green-shirt',
      name: 'green-shirt-worn.png',
      // Bottom-right quadrant:
      crop: { x: 660, y: 475, w: 210, h: 175 },
      // Forest green: G > R and G > B, overall dark R: 20..60, G: 35..85, B: 25..65
      isGarment: (r, g, b) => (g >= r && g >= b) && r < 80 && g < 95 && b < 80 && (r + g + b) > 30,
    },
  ];

  for (const item of items) {
    const cropped = img.clone().crop({
      x: item.crop.x,
      y: item.crop.y,
      w: item.crop.w,
      h: item.crop.h,
    });

    const w = cropped.bitmap.width;
    const h = cropped.bitmap.height;

    // Process alpha mask
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const color = cropped.getPixelColor(x, y);
        const r = (color >> 24) & 255;
        const g = (color >> 16) & 255;
        const b = (color >> 8) & 255;

        // Check if inside garment
        if (!item.isGarment(r, g, b, x, y)) {
          cropped.setPixelColor(0x00000000, x, y);
        }
      }
    }

    const dest = path.join(outDir, item.name);
    await cropped.write(dest);
    console.log('Saved isolated worn garment:', dest);
  }
}

segmentGarmentsFromMan().catch(console.error);

