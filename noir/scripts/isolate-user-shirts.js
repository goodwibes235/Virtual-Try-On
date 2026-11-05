const { Jimp } = require('jimp');
const path = require('path');

const garmentsDir = path.join(process.cwd(), 'public', 'garments');

// The 4 user files:
// 1. belgian-training-tee.jpg (2026 Belgian Fans Football Training T-Shirt - 3D Print)
// 2. graphic-streetwear-tee.jpg (394768723610443558.jpg)
// 3. blue-geometric-tee.jpg (485262928624246315.jpg)
// 4. golf-polo-3d.jpg (Herren 3D-Druck Golf Poloshirt)

async function isolateGarmentsWithFloodFill() {
  const list = [
    { src: 'belgian-training-tee.jpg', out: 'belgian-training-tee.png', tolerance: 35 },
    { src: 'graphic-streetwear-tee.jpg', out: 'graphic-streetwear-tee.png', tolerance: 25 },
    { src: 'blue-geometric-tee.jpg', out: 'blue-geometric-tee.png', tolerance: 38 },
    { src: 'golf-polo-3d.jpg', out: 'golf-polo-3d.png', tolerance: 35 },
  ];

  for (const item of list) {
    const srcPath = path.join(garmentsDir, item.src);
    const img = await Jimp.read(srcPath);
    const w = img.bitmap.width;
    const h = img.bitmap.height;

    // We know background touches the perimeter (outer edges):
    // Let's perform a multi-seed Breadth-First Flood Fill from all 4 borders to remove background!
    const visited = new Uint8Array(w * h);
    const queue = [];

    // Push all border pixels as initial seeds
    for (let x = 0; x < w; x++) {
      queue.push(x, 0); // top border
      visited[0 * w + x] = 1;
      queue.push(x, h - 1); // bottom border
      visited[(h - 1) * w + x] = 1;
    }
    for (let y = 0; y < h; y++) {
      queue.push(0, y); // left border
      visited[y * w + 0] = 1;
      queue.push(w - 1, y); // right border
      visited[y * w + (w - 1)] = 1;
    }

    // Get background reference samples from corners
    const getRGB = (x, y) => {
      const p = img.getPixelColor(x, y);
      return [(p >> 24) & 255, (p >> 16) & 255, (p >> 8) & 255];
    };

    const c0 = getRGB(2, 2);
    const c1 = getRGB(w - 3, 2);
    const c2 = getRGB(2, h - 3);
    const c3 = getRGB(w - 3, h - 3);

    const isBgColor = (r, g, b, prevR, prevG, prevB) => {
      // Check distance to corner background references or adjacent traversed background
      const d0 = Math.hypot(r - c0[0], g - c0[1], b - c0[2]);
      const d1 = Math.hypot(r - c1[0], g - c1[1], b - c1[2]);
      const d2 = Math.hypot(r - c2[0], g - c2[1], b - c2[2]);
      const d3 = Math.hypot(r - c3[0], g - c3[1], b - c3[2]);
      const dPrev = Math.hypot(r - prevR, g - prevG, b - prevB);

      if (d0 < item.tolerance || d1 < item.tolerance || d2 < item.tolerance || d3 < item.tolerance) {
        return true;
      }
      // If close to previous border neighbor with tight tolerance
      if (dPrev < 18) {
        return true;
      }
      return false;
    };

    let head = 0;
    while (head < queue.length) {
      const qx = queue[head++];
      const qy = queue[head++];

      const [qr, qg, qb] = getRGB(qx, qy);

      // Set current pixel transparent
      img.setPixelColor(0x00000000, qx, qy);

      // 4-neighborhood
      const neighbors = [
        [qx + 1, qy],
        [qx - 1, qy],
        [qx, qy + 1],
        [qx, qy - 1],
      ];

      for (const [nx, ny] of neighbors) {
        if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
          const idx = ny * w + nx;
          if (!visited[idx]) {
            visited[idx] = 1;
            const [nr, ng, nb] = getRGB(nx, ny);
            if (isBgColor(nr, ng, nb, qr, qg, qb)) {
              queue.push(nx, ny);
            }
          }
        }
      }
    }

    const outPath = path.join(garmentsDir, item.out);
    await img.write(outPath);
    console.log('Saved isolated transparent garment:', outPath);
  }
}

isolateGarmentsWithFloodFill().catch(console.error);

