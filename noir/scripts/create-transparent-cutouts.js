const { Jimp } = require('jimp');
const path = require('path');

const srcPath = 'C:/Users/Abdul Rehman/.gemini/antigravity/brain/42acefc6-cb61-412f-b6a1-62d88b2f3368/.user_uploaded/media_1793787394038_2a0da3c7.jpg';
const outDir = path.join(process.cwd(), 'public', 'garments');

// Inspect pixel colors in thumbnail cards to make clean transparent PNGs
async function createTransparentCutouts() {
  const img = await Jimp.read(srcPath);

  // Thumbnails with their coordinates on the 1024x682 sheet:
  // Card 1 (Black): around x:20..115, y:20..115
  // Card 2 (White): around x:530..630, y:20..115
  // Card 3 (Navy): around x:20..115, y:360..455
  // Card 4 (Green): around x:530..630, y:360..455
  
  const cuts = [
    {
      name: 'black-tee-clean.png',
      crop: { x: 23, y: 35, w: 94, h: 95 },
      type: 'dark',
    },
    {
      name: 'white-tee-clean.png',
      crop: { x: 535, y: 35, w: 94, h: 95 },
      type: 'white',
    },
    {
      name: 'navy-polo-clean.png',
      crop: { x: 23, y: 375, w: 94, h: 95 },
      type: 'dark',
    },
    {
      name: 'green-shirt-clean.png',
      crop: { x: 535, y: 370, w: 94, h: 95 },
      type: 'dark',
    },
  ];

  for (const c of cuts) {
    const cropped = img.clone().crop({
      x: c.crop.x,
      y: c.crop.y,
      w: c.crop.w,
      h: c.crop.h,
    });

    const w = cropped.bitmap.width;
    const h = cropped.bitmap.height;

    // The background of the card is a very light grey / off-white (#ebebeb to #f5f5f5)
    // Corner pixels can tell us the card background color
    const cornerPixel = cropped.getPixelColor(2, 2);
    const cr = (cornerPixel >> 24) & 255;
    const cg = (cornerPixel >> 16) & 255;
    const cb = (cornerPixel >> 8) & 255;
    console.log(`${c.name} background reference RGB:`, cr, cg, cb);

    // Make card background transparent:
    // Any pixel near (cr, cg, cb) or where r,g,b are close to grey background
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < h; x++) {
        const color = cropped.getPixelColor(x, y);
        const r = (color >> 24) & 255;
        const g = (color >> 16) & 255;
        const b = (color >> 8) & 255;
        
        let isBg = false;
        if (c.type === 'dark') {
          // For dark garments (black, navy, green), anything light (r > 200, g > 200, b > 200) is card background!
          if (r > 195 && g > 195 && b > 195) {
            isBg = true;
          }
        } else {
          // For white tee: the shirt is #ffffff to #f0f0f0, but card background is #ebebeb (differs slightly)
          // Also let's check distance to corner color
          const dist = Math.sqrt((r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2);
          if (dist < 15) {
            isBg = true;
          }
        }

        if (isBg) {
          // Set alpha to 0
          cropped.setPixelColor(0x00000000, x, y);
        }
      }
    }

    const dest = path.join(outDir, c.name);
    await cropped.write(dest);
    console.log('Saved transparent garment asset:', dest);
  }
}

createTransparentCutouts().catch(console.error);

