const { Jimp } = require('jimp');
const path = require('path');
const fs = require('fs');

const inDir = path.join(process.cwd(), 'shirt desing');
const outDir = path.join(process.cwd(), 'public', 'garments');

async function buildCleanGarments() {
  // 1. Graphic Streetwear Tee (394768723610443558.jpg)
  // Background is pure white (#FFFFFF). Flood fill from the 4 outer image edges.
  {
    const file = '394768723610443558.jpg';
    const img = await Jimp.read(path.join(inDir, file));
    const w = img.bitmap.width, h = img.bitmap.height;

    // Outer-edge flood fill for pure white background
    const visited = new Uint8Array(w * h);
    const queue = [];

    const isWhiteBg = (r, g, b) => r >= 238 && g >= 238 && b >= 238;

    for (let x = 0; x < w; x++) {
      if (isWhiteBg(...getRGB(img, x, 0))) { queue.push(x, 0); visited[0 * w + x] = 1; }
      if (isWhiteBg(...getRGB(img, x, h - 1))) { queue.push(x, h - 1); visited[(h - 1) * w + x] = 1; }
    }
    for (let y = 0; y < h; y++) {
      if (isWhiteBg(...getRGB(img, 0, y))) { queue.push(0, y); visited[y * w + 0] = 1; }
      if (isWhiteBg(...getRGB(img, w - 1, y))) { queue.push(w - 1, y); visited[y * w + (w - 1)] = 1; }
    }

    flood(img, visited, queue, w, h, isWhiteBg);

    const dest = path.join(outDir, 'graphic-streetwear-tee.png');
    await img.write(dest);
    console.log('Processed 1:', dest);
  }

  // 2. Cobalt Geometric 3D Tee (485262928624246315.jpg)
  // Studio neutral taupe/grey backdrop. Outer-edge flood fill.
  {
    const file = '485262928624246315.jpg';
    const img = await Jimp.read(path.join(inDir, file));
    const w = img.bitmap.width, h = img.bitmap.height;

    const visited = new Uint8Array(w * h);
    const queue = [];

    // Backdrop has low saturation, lum 60-190. Shirt is deep black or vivid cobalt blue.
    const isBackdrop = (r, g, b) => {
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const isBlue = (b > r + 15 || b > g + 10);
      const isBlack = (lum < 28);
      const sat = Math.max(Math.abs(r - g), Math.abs(r - b), Math.abs(g - b));
      return !isBlue && !isBlack && sat < 20 && lum >= 55 && lum <= 195;
    };

    for (let x = 0; x < w; x++) {
      if (isBackdrop(...getRGB(img, x, 0))) { queue.push(x, 0); visited[0 * w + x] = 1; }
      if (isBackdrop(...getRGB(img, x, h - 1))) { queue.push(x, h - 1); visited[(h - 1) * w + x] = 1; }
    }
    for (let y = 0; y < h; y++) {
      if (isBackdrop(...getRGB(img, 0, y))) { queue.push(0, y); visited[y * w + 0] = 1; }
      if (isBackdrop(...getRGB(img, w - 1, y))) { queue.push(w - 1, y); visited[y * w + (w - 1)] = 1; }
    }

    flood(img, visited, queue, w, h, isBackdrop);

    const dest = path.join(outDir, 'blue-geometric-tee.png');
    await img.write(dest);
    console.log('Processed 2:', dest);
  }

  // 3. Belgian Fans Football Training T-Shirt
  {
    const file = '2026 Belgian Fans Football Training T-Shirt - 3D Print - Fashionable, Comfortable and Breathable -.jpg';
    const img = await Jimp.read(path.join(inDir, file));
    const w = img.bitmap.width, h = img.bitmap.height;

    const visited = new Uint8Array(w * h);
    const queue = [];

    // Dark grey studio backdrop
    const isBackdrop = (r, g, b) => {
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const sat = Math.max(Math.abs(r - g), Math.abs(r - b), Math.abs(g - b));
      return (sat < 15 && lum >= 40 && lum <= 135);
    };

    for (let x = 0; x < w; x++) {
      if (isBackdrop(...getRGB(img, x, 0))) { queue.push(x, 0); visited[0 * w + x] = 1; }
      if (isBackdrop(...getRGB(img, x, h - 1))) { queue.push(x, h - 1); visited[(h - 1) * w + x] = 1; }
    }
    for (let y = 0; y < h; y++) {
      if (isBackdrop(...getRGB(img, 0, y))) { queue.push(0, y); visited[y * w + 0] = 1; }
      if (isBackdrop(...getRGB(img, w - 1, y))) { queue.push(w - 1, y); visited[y * w + (w - 1)] = 1; }
    }

    flood(img, visited, queue, w, h, isBackdrop);

    const dest = path.join(outDir, 'belgian-training-tee.png');
    await img.write(dest);
    console.log('Processed 3:', dest);
  }

  // 4. Golf Poloshirt 3D
  {
    const file = 'Herren 3D-Druck Golf Poloshirt Kurzarm Mikro-Elastisches Polyester Outdoor Casual Sommer Streetwear.jpg';
    const img = await Jimp.read(path.join(inDir, file));
    const w = img.bitmap.width, h = img.bitmap.height;

    const visited = new Uint8Array(w * h);
    const queue = [];

    const isBackdrop = (r, g, b) => {
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      const sat = Math.max(Math.abs(r - g), Math.abs(r - b), Math.abs(g - b));
      return (sat < 14 && lum >= 15 && lum <= 130);
    };

    for (let x = 0; x < w; x++) {
      if (isBackdrop(...getRGB(img, x, 0))) { queue.push(x, 0); visited[0 * w + x] = 1; }
      if (isBackdrop(...getRGB(img, x, h - 1))) { queue.push(x, h - 1); visited[(h - 1) * w + x] = 1; }
    }
    for (let y = 0; y < h; y++) {
      if (isBackdrop(...getRGB(img, 0, y))) { queue.push(0, y); visited[y * w + 0] = 1; }
      if (isBackdrop(...getRGB(img, w - 1, y))) { queue.push(w - 1, y); visited[y * w + (w - 1)] = 1; }
    }

    flood(img, visited, queue, w, h, isBackdrop);

    const dest = path.join(outDir, 'golf-polo-3d.png');
    await img.write(dest);
    console.log('Processed 4:', dest);
  }
}

function getRGB(img, x, y) {
  const c = img.getPixelColor(x, y);
  return [(c >> 24) & 255, (c >> 16) & 255, (c >> 8) & 255];
}

function flood(img, visited, queue, w, h, isBg) {
  let head = 0;
  while (head < queue.length) {
    const x = queue[head++];
    const y = queue[head++];

    img.setPixelColor(0x00000000, x, y);

    const nbs = [
      [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]
    ];
    for (const [nx, ny] of nbs) {
      if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
        const idx = ny * w + nx;
        if (!visited[idx]) {
          visited[idx] = 1;
          const [r, g, b] = getRGB(img, nx, ny);
          if (isBg(r, g, b)) {
            queue.push(nx, ny);
          }
        }
      }
    }
  }
}

buildCleanGarments().catch(console.error);

