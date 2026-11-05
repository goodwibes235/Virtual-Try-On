export interface MeshVertex {
  x: number;
  y: number;
  u: number;
  v: number;
}

export interface TriangleIndices {
  i0: number;
  i1: number;
  i2: number;
}

/**
 * Draws a texture-mapped triangle using Canvas 2D affine transform.
 * Clips to triangle and applies 2D matrix transformation.
 */
export function drawAffineTriangle(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  p0: MeshVertex,
  p1: MeshVertex,
  p2: MeshVertex
): void {
  const x0 = p0.x, y0 = p0.y;
  const x1 = p1.x, y1 = p1.y;
  const x2 = p2.x, y2 = p2.y;

  const u0 = p0.u * img.width, v0 = p0.v * img.height;
  const u1 = p1.u * img.width, v1 = p1.v * img.height;
  const u2 = p2.u * img.width, v2 = p2.v * img.height;

  // 1. Clip path with slight dilation to prevent visible black seams between facets
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.closePath();
  ctx.clip();

  // 2. Solve 2D affine mapping (u, v) -> (x, y)
  const delta = u0 * (v1 - v2) - v0 * (u1 - u2) + (u1 * v2 - u2 * v1);
  if (Math.abs(delta) < 1e-6) {
    ctx.restore();
    return;
  }

  const deltaX = x0 * (v1 - v2) - v0 * (x1 - x2) + (x1 * v2 - x2 * v1);
  const deltaY = u0 * (x1 - x2) - x0 * (u1 - u2) + (u1 * x2 - u2 * x1);
  const deltaZ = u0 * (v1 * x2 - v2 * x1) - v0 * (u1 * x2 - u2 * x1) + x0 * (u1 * v2 - u2 * v1);

  const deltaW = y0 * (v1 - v2) - v0 * (y1 - y2) + (y1 * v2 - y2 * v1);
  const deltaV = u0 * (y1 - y2) - y0 * (u1 - u2) + (u1 * y2 - u2 * y1);
  const deltaU = u0 * (v1 * y2 - v2 * y1) - v0 * (u1 * y2 - u2 * y1) + y0 * (u1 * v2 - u2 * v1);

  const a = deltaX / delta;
  const b = deltaW / delta;
  const c = deltaY / delta;
  const d = deltaV / delta;
  const e = deltaZ / delta;
  const f = deltaU / delta;

  ctx.transform(a, b, c, d, e, f);
  ctx.drawImage(img, 0, 0);

  ctx.restore();
}
