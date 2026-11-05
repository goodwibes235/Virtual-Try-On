const { Jimp } = require('jimp');
const path = require('path');

const srcPath = 'C:/Users/Abdul Rehman/.gemini/antigravity/brain/42acefc6-cb61-412f-b6a1-62d88b2f3368/.user_uploaded/media_1793787394038_2a0da3c7.jpg';
const outDir = path.join(process.cwd(), 'public', 'garments');

// Image is 1024 x 682
// 4 quadrants:
// Top-Left: Black Oversized Tee (thumbnail card at left x:10..130, y:15..160)
// Top-Right: White Regular Tee (thumbnail card at left x:522..642, y:15..160)
// Bottom-Left: Navy Polo Shirt (thumbnail card at left x:10..130, y:355..500)
// Bottom-Right: Green Shirt (thumbnail card at left x:522..642, y:355..500)

async function extractGarments() {
  const img = await Jimp.read(srcPath);

  // Let's define the 4 garment regions on the human model:
  // Model 1 (Top Left, Black Tee):
  // Shoulders are around y:100 to y:315, x:150 to x:380
  // Let's crop the actual worn garment and also inspect background color
  const items = [
    {
      name: 'black-oversized-worn.png',
      crop: { x: 150, y: 90, w: 230, h: 235 },
      garmentType: 'black',
    },
    {
      name: 'white-regular-worn.png',
      crop: { x: 660, y: 95, w: 225, h: 230 },
      garmentType: 'white',
    },
    {
      name: 'navy-polo-worn.png',
      crop: { x: 165, y: 435, w: 200, h: 220 },
      garmentType: 'navy',
    },
    {
      name: 'green-shirt-worn.png',
      crop: { x: 670, y: 435, w: 200, h: 220 },
      garmentType: 'green',
    },
  ];

  for (const item of items) {
    const cropped = img.clone().crop({
      x: item.crop.x,
      y: item.crop.y,
      w: item.crop.w,
      h: item.crop.h,
    });
    const dest = path.join(outDir, item.name);
    await cropped.write(dest);
    console.log('Saved cropped model garment to:', dest);
  }

  // Also extract the clean standalone thumbnail garment cards:
  const thumbnails = [
    { name: 'black-tee-cutout.png', crop: { x: 20, y: 25, w: 100, h: 105 } },
    { name: 'white-tee-cutout.png', crop: { x: 535, y: 25, w: 100, h: 105 } },
    { name: 'navy-polo-cutout.png', crop: { x: 20, y: 365, w: 100, h: 105 } },
    { name: 'green-shirt-cutout.png', crop: { x: 535, y: 365, w: 100, h: 105 } },
  ];

  for (const t of thumbnails) {
    const cropped = img.clone().crop({
      x: t.crop.x,
      y: t.crop.y,
      w: t.crop.w,
      h: t.crop.h,
    });
    const dest = path.join(outDir, t.name);
    await cropped.write(dest);
    console.log('Saved thumbnail cutout to:', dest);
  }
}

extractGarments().catch(console.error);

