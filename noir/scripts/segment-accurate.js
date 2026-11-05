const { Jimp } = require('jimp');
const path = require('path');
const fs = require('fs');

const inDir = path.join(process.cwd(), 'shirt desing');
const outDir = path.join(process.cwd(), 'public', 'garments');

// High-accuracy background flood fill segmentation starting from image borders
async function segmentAccurately() {
  const tasks = [
    {
      src: '394768723610443558.jpg',
      out: 'graphic-streetwear-tee.png',
      // Pure white studio background
      isBorderBg: (r, g, b) => r > 235 && g > 235 && b > 235,
    },
    {
      src: '485262928624246315.jpg',
      out: 'blue-geometric-tee.png',
      // Warm grey / taupe background wall & surface (r~=g~=b in 85..175 with low saturation)
      isBorderBg: (r, g, b) => {
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        const sat = Math.max(Math.abs(r - g), Math.abs(r - b), Math.abs(g - b));
        // Blue geometric shirt has high blue saturation (b > r + 15) or very dark black (lum < 30)
        return (lum > 65 && lum < 185 && sat < 18);
      },
    },
    {
      src: '2026 Belgian Fans Football Training T-Shirt - 3D Print - Fashionable, Comfortable and Breathable -.jpg',
      out: 'belgian-training-tee.png',
      // Studio dark slate background
      isBorderBg: (r, g, b) => {
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        const sat = Math.max(Math.abs(r - g), Math.abs(r - b), Math.abs(g - b));
        return (lum > 50 && lum < 130 && sat < 12);
      },
    },
    {
      src: 'Herren 3D-Druck Golf Poloshirt Kurzarm Mikro-Elastisches Polyester Outdoor Casual Sommer Streetwear.jpg',
      out: 'golf-polo-3d.png',
      // Studio slate background
      isBorderBg: (r, g, b) => {
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        const sat = Math.max(Math.abs(r - g), Math.abs(r - b), Math.abs(g - b));
        return (lum > 48 && lum < 125 && sat < 14);
      },
    },
  ];

  for (const t of tasks) {
    const srcPath = path.join(inDir, t.src);
    const img = await Jimp.read(srcPath);
    const w = img.bitmap.width;
    const h = img.bitmap.height;

    // Seed flood fill from the 4 outer edges
    const visited = new Uint8Array(w * h);
    const queue = [];

    const tryPush = (x, y) => {
      const idx = y * w + x;
      if (!visited[idx]) {
        visited[idx] = 1;
        const col = img.getPixelColor(x, y);
        const r = (col >> 24) & 255, g = (col >> 16) & 255, b = (col >> 8) & 255;
        if (t.isBorderBg(r, g, b)) {
          queue.push(x, y);
        }
      }
    };

    for (let x = 0; x < w; x++) {
      tryPush(x, 0);
      tryPush(x, h - 1);
    }
    for (let y = 0; y < h; y++) {
      tryPush(0, y);
      tryPush(w - 1, y);
    }

    let head = 0;
    while (head < queue.length) {
      const qx = queue[head++];
      const qy = queue[head++];

      // Mark this pixel completely transparent
      img.setPixelColor(0x00000000, qx, qy);

      const neighbors = [
        [qx + 1, qy],
        [qx - 1, qy],
        [qx, qy + 1],
        [qx, qy - 1],
      ];

      for (const [nx, ny] of neighbors) {
        if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
          const nidx = ny * w + nx;
          if (!visited[nidx]) {
            visited[nidx] = 1;
            const ncol = img.getPixelColor(nx, ny);
            const nr = (ncol >> 24) & 255, ng = (ncol >> 16) & 255, nb = (ncol >> 8) & 255;
            if (t.isBorderBg(nr, ng, nb)) {
              queue.push(nx, ny);
            }
          }
        }
      }
    }

    const dest = path.join(outDir, t.out);
    await img.write(dest);
    console.log('Saved clean segmented HD asset to:', dest);
  }
}

segmentAccurately().catch(console.error);

