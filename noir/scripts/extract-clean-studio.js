const { Jimp } = require('jimp');
const path = require('path');

const srcPath = 'C:/Users/Abdul Rehman/.gemini/antigravity/brain/42acefc6-cb61-412f-b6a1-62d88b2f3368/.user_uploaded/media_1793788099243_00af8bb5.jpg';
const outDir = path.join(process.cwd(), 'public', 'garments');

async function extractCleanStudioGarments() {
  const img = await Jimp.read(srcPath);

  // In the uploaded image, there are 4 clean studio garment cards on the left of each quadrant:
  // Card 1 (Black Oversized Tee): x:18 to x:120, y:20 to x:140
  // Card 2 (White Regular Tee): x:530 to x:632, y:20 to x:140
  // Card 3 (Navy Polo Shirt): x:18 to x:120, y:360 to x:480
  // Card 4 (Green Shirt): x:530 to x:632, y:360 to x:480

  const items = [
    {
      name: 'black-oversized-card.png',
      crop: { x: 23, y: 35, w: 94, h: 95 },
      type: 'dark',
    },
    {
      name: 'white-regular-card.png',
      crop: { x: 535, y: 35, w: 94, h: 95 },
      type: 'white',
    },
    {
      name: 'navy-polo-card.png',
      crop: { x: 23, y: 375, w: 94, h: 95 },
      type: 'navy',
    },
    {
      name: 'green-shirt-card.png',
      crop: { x: 535, y: 370, w: 94, h: 95 },
      type: 'green',
    },
  ];

  for (const item of items) {
    // Crop the card
    const cropped = img.clone().crop({
      x: item.crop.x,
      y: item.crop.y,
      w: item.crop.w,
      h: item.crop.h,
    });

    // Resize to high resolution 600x600 for sharp rendering on camera feed
    cropped.resize({ w: 600, h: 600 });

    const w = cropped.bitmap.width;
    const h = cropped.bitmap.height;

    // Remove the card background (grey around #ebebeb to #f2f2f2)
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const color = cropped.getPixelColor(x, y);
        const r = (color >> 24) & 255;
        const g = (color >> 16) & 255;
        const b = (color >> 8) & 255;

        let isBg = false;
        if (item.type === 'dark' || item.type === 'navy' || item.type === 'green') {
          // Card background is light grey: r > 185, g > 185, b > 185
          // while dark garments have r,g,b < 100
          if (r > 185 && g > 185 && b > 185) {
            isBg = true;
          }
        } else if (item.type === 'white') {
          // White regular tee: shirt is bright white (#fff to #f5f5f5) with dark shadow contours
          // Card background is uniform grey (#ebebeb)
          // Look at corners
          const isCardGrey = (r >= 230 && r <= 242 && g >= 230 && g <= 242 && b >= 230 && b <= 242);
          if (isCardGrey) {
            isBg = true;
          }
        }

        if (isBg) {
          cropped.setPixelColor(0x00000000, x, y);
        }
      }
    }

    const dest = path.join(outDir, item.name);
    await cropped.write(dest);
    console.log('Saved high-res studio asset:', dest);
  }
}

extractCleanStudioGarments().catch(console.error);

