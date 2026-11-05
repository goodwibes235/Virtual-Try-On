const { Jimp } = require('jimp');
const path = require('path');

const inDir = path.join(process.cwd(), 'shirt desing');
const outDir = path.join(process.cwd(), 'public', 'garments');

async function segmentDarkStudioShirts() {
  const tasks = [
    {
      src: '2026 Belgian Fans Football Training T-Shirt - 3D Print - Fashionable, Comfortable and Breathable -.jpg',
      out: 'belgian-training-tee.png',
      // Background is the studio wall and floor.
      // Wall has lum in 45..125, sat < 15. Floor has lum in 50..130.
      isBg: (r, g, b, x, y, w, h) => {
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        const sat = Math.max(Math.abs(r - g), Math.abs(r - b), Math.abs(g - b));
        return (lum >= 42 && lum <= 135 && sat < 14);
      },
    },
    {
      src: 'Herren 3D-Druck Golf Poloshirt Kurzarm Mikro-Elastisches Polyester Outdoor Casual Sommer Streetwear.jpg',
      out: 'golf-polo-3d.png',
      // Corner is very dark (lum ~ 23). Wall gradient is 18..130, sat < 14.
      isBg: (r, g, b, x, y, w, h) => {
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        const sat = Math.max(Math.abs(r - g), Math.abs(r - b), Math.abs(g - b));
        return (lum <= 130 && sat < 12);
      },
    },
  ];

  for (const t of tasks) {
    const srcPath = path.join(inDir, t.src);
    const img = await Jimp.read(srcPath);
    const w = img.bitmap.width;
    const h = img.bitmap.height;

    const visited = new Uint8Array(w * h);
    const queue = [];

    const tryPush = (x, y) => {
      const idx = y * w + x;
      if (!visited[idx]) {
        visited[idx] = 1;
        const col = img.getPixelColor(x, y);
        const r = (col >> 24) & 255, g = (col >> 16) & 255, b = (col >> 8) & 255;
        if (t.isBg(r, g, b, x, y, w, h)) {
          queue.push(x, y);
        }
      }
    };

    // Seed from all 4 borders
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
            if (t.isBg(nr, ng, nb, nx, ny, w, h)) {
              queue.push(nx, ny);
            }
          }
        }
      }
    }

    const dest = path.join(outDir, t.out);
    await img.write(dest);
    console.log('Saved segmented dark studio shirt to:', dest);
  }
}

segmentDarkStudioShirts().catch(console.error);

