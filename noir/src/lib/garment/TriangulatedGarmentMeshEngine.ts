import { ExtractedBodyLandmarks } from '@/lib/pose/PoseDetection';
import { MeshVertex, TriangleIndices, drawAffineTriangle } from './AffineWarp';

export interface PhotorealFitParameters {
  shoulderSpanMultiplier: number;
  sleeveLengthRatio: number;
  torsoLengthMultiplier: number;
  waistFlare: number;
  collarDipOffset: number;
  depthExtrusion: number; // 3D depth curvature multiplier
}

export class TriangulatedGarmentMeshEngine {
  private garmentImage: HTMLImageElement | null = null;
  private isLoaded: boolean = false;
  private currentAssetPath: string = '';

  // 15-vertex anatomical layout for high-fidelity 3D curvature:
  // 0: Collar Left
  // 1: Collar Center (Neckline dip)
  // 2: Collar Right
  // 3: Left Outer Shoulder / Drop
  // 4: Right Outer Shoulder / Drop
  // 5: Left Outer Sleeve Cuff
  // 6: Right Outer Sleeve Cuff
  // 7: Left Inner Armpit
  // 8: Right Inner Armpit
  // 9: Sternum / Upper Chest Bulge (3D curvature)
  // 10: Left Mid-Torso / Ribs
  // 11: Right Mid-Torso / Ribs
  // 12: Left Hem Corner
  // 13: Right Hem Corner
  // 14: Bottom Hem Center
  private static readonly TRIANGLES: TriangleIndices[] = [
    // Upper Chest & Neckline
    { i0: 0, i1: 1, i2: 9 }, // Collar Left - Neck - Sternum
    { i0: 1, i1: 2, i2: 9 }, // Neck - Collar Right - Sternum
    { i0: 0, i1: 3, i2: 9 }, // Collar Left - L Shoulder - Sternum
    { i0: 2, i1: 4, i2: 9 }, // Collar Right - R Shoulder - Sternum

    // Left Sleeve
    { i0: 3, i1: 5, i2: 7 }, // L Shoulder - L Cuff - L Armpit
    { i0: 3, i1: 7, i2: 9 }, // L Shoulder - L Armpit - Sternum

    // Right Sleeve
    { i0: 4, i1: 8, i2: 6 }, // R Shoulder - R Armpit - R Cuff
    { i0: 4, i1: 9, i2: 8 }, // R Shoulder - Sternum - R Armpit

    // Mid Torso (Ribs & 3D Chest Volume)
    { i0: 7, i1: 10, i2: 9 }, // L Armpit - L Rib - Sternum
    { i0: 8, i1: 9, i2: 11 }, // R Armpit - Sternum - R Rib
    { i0: 9, i1: 10, i2: 14 }, // Sternum - L Rib - Hem Center
    { i0: 9, i1: 14, i2: 11 }, // Sternum - Hem Center - R Rib

    // Lower Torso & Curved Hemline
    { i0: 10, i1: 12, i2: 14 }, // L Rib - L Hem - Hem Center
    { i0: 11, i1: 14, i2: 13 }, // R Rib - Hem Center - R Hem
  ];

  // Texture UV coordinates normalized across the isolated garment images
  private static readonly BASE_UVS: Array<{ u: number; v: number }> = [
    { u: 0.38, v: 0.05 }, // 0: Collar Left
    { u: 0.50, v: 0.14 }, // 1: Collar Center
    { u: 0.62, v: 0.05 }, // 2: Collar Right
    { u: 0.18, v: 0.16 }, // 3: L Shoulder
    { u: 0.82, v: 0.16 }, // 4: R Shoulder
    { u: 0.02, v: 0.42 }, // 5: L Sleeve Cuff
    { u: 0.98, v: 0.42 }, // 6: R Sleeve Cuff
    { u: 0.26, v: 0.42 }, // 7: L Armpit
    { u: 0.74, v: 0.42 }, // 8: R Armpit
    { u: 0.50, v: 0.38 }, // 9: Sternum (Center Chest)
    { u: 0.28, v: 0.68 }, // 10: L Rib
    { u: 0.72, v: 0.68 }, // 11: R Rib
    { u: 0.26, v: 0.97 }, // 12: L Hem
    { u: 0.74, v: 0.97 }, // 13: R Hem
    { u: 0.50, v: 0.98 }, // 14: Hem Center
  ];

  public async loadGarment(assetPath: string): Promise<void> {
    if (this.currentAssetPath === assetPath && this.isLoaded) return;

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = assetPath;
      img.onload = () => {
        this.garmentImage = img;
        this.isLoaded = true;
        this.currentAssetPath = assetPath;
        resolve();
      };
      img.onerror = (e) => reject(e);
    });
  }

  /**
   * Computes anatomical 3D vertices using MediaPipe XYZ landmarks:
   * Handles yaw rotation (depth differential between shoulders),
   * pitch (leaning forward/backwards), and volumetric chest arching.
   */
  public computeDeformedVertices(
    landmarks: ExtractedBodyLandmarks,
    canvasWidth: number,
    canvasHeight: number,
    isMirrored: boolean,
    params: PhotorealFitParameters
  ): MeshVertex[] | null {
    const { leftShoulder, rightShoulder, leftElbow, rightElbow, leftHip, rightHip } = landmarks;

    const minVis = 0.38;
    if (leftShoulder.visibility < minVis || rightShoulder.visibility < minVis) {
      return null;
    }

    const tx = (x: number) => (isMirrored ? (1 - x) * canvasWidth : x * canvasWidth);
    const ty = (y: number) => y * canvasHeight;

    const ls = { x: tx(leftShoulder.x), y: ty(leftShoulder.y), z: leftShoulder.z };
    const rs = { x: tx(rightShoulder.x), y: ty(rightShoulder.y), z: rightShoulder.z };
    const le = { x: tx(leftElbow.x), y: ty(leftElbow.y) };
    const re = { x: tx(rightElbow.x), y: ty(rightElbow.y) };
    const lh = { x: tx(leftHip.x), y: ty(leftHip.y) };
    const rh = { x: tx(rightHip.x), y: ty(rightHip.y) };

    const sDx = rs.x - ls.x;
    const sDy = rs.y - ls.y;
    const shoulderWidth = Math.sqrt(sDx * sDx + sDy * sDy);
    const shoulderAngle = Math.atan2(sDy, sDx);

    // 3D Yaw Rotation from Z-depth difference
    // When turning: one side compresses and recedes in perspective
    const zDiff = (rs.z - ls.z) * 2.2;
    const leftPerspective = Math.max(0.72, Math.min(1.28, 1 - zDiff));
    const rightPerspective = Math.max(0.72, Math.min(1.28, 1 + zDiff));

    const midShoulder = {
      x: (ls.x + rs.x) / 2,
      y: (ls.y + rs.y) / 2,
    };

    // Calculate torso height & spine tilt vector
    let torsoLen = shoulderWidth * 1.35;
    if (leftHip.visibility > minVis && rightHip.visibility > minVis) {
      const midHipX = (lh.x + rh.x) / 2;
      const midHipY = (lh.y + rh.y) / 2;
      torsoLen = Math.sqrt((midHipX - midShoulder.x) ** 2 + (midHipY - midShoulder.y) ** 2);
    }
    const fullTorsoLen = torsoLen * params.torsoLengthMultiplier;

    // 0, 1, 2: Collar & Neckline
    const collarRadius = shoulderWidth * 0.17;
    const collarDip = shoulderWidth * params.collarDipOffset;

    const v0 = {
      x: midShoulder.x - Math.cos(shoulderAngle) * collarRadius * leftPerspective,
      y: midShoulder.y - Math.sin(shoulderAngle) * collarRadius * leftPerspective,
    };
    const v2 = {
      x: midShoulder.x + Math.cos(shoulderAngle) * collarRadius * rightPerspective,
      y: midShoulder.y + Math.sin(shoulderAngle) * collarRadius * rightPerspective,
    };
    const v1 = {
      x: midShoulder.x + Math.sin(shoulderAngle) * collarDip,
      y: midShoulder.y + Math.cos(shoulderAngle) * collarDip,
    };

    // 3, 4: Outer Shoulders (extended with shoulderSpanMultiplier)
    const shoulderSpanHalf = (shoulderWidth * params.shoulderSpanMultiplier) * 0.5;
    const v3 = {
      x: midShoulder.x - Math.cos(shoulderAngle) * shoulderSpanHalf * leftPerspective,
      y: midShoulder.y - Math.sin(shoulderAngle) * shoulderSpanHalf * leftPerspective,
    };
    const v4 = {
      x: midShoulder.x + Math.cos(shoulderAngle) * shoulderSpanHalf * rightPerspective,
      y: midShoulder.y + Math.sin(shoulderAngle) * shoulderSpanHalf * rightPerspective,
    };

    // 5, 6: Outer Sleeve Cuffs following real elbow kinematics
    const lArmVec = { x: le.x - ls.x, y: le.y - ls.y };
    const lArmLen = Math.max(10, Math.hypot(lArmVec.x, lArmVec.y));
    const lSleeveDist = Math.min(lArmLen * params.sleeveLengthRatio, shoulderWidth * 0.9);

    const v5 = {
      x: v3.x + (lArmVec.x / lArmLen) * lSleeveDist,
      y: v3.y + (lArmVec.y / lArmLen) * lSleeveDist,
    };

    const rArmVec = { x: re.x - rs.x, y: re.y - rs.y };
    const rArmLen = Math.max(10, Math.hypot(rArmVec.x, rArmVec.y));
    const rSleeveDist = Math.min(rArmLen * params.sleeveLengthRatio, shoulderWidth * 0.9);

    const v6 = {
      x: v4.x + (rArmVec.x / rArmLen) * rSleeveDist,
      y: v4.y + (rArmVec.y / rArmLen) * rSleeveDist,
    };

    // 7, 8: Armpits
    const armpitDrop = fullTorsoLen * 0.28;
    const chestWidthHalf = shoulderWidth * 0.53;

    const v7 = {
      x: midShoulder.x - Math.cos(shoulderAngle) * chestWidthHalf * leftPerspective + Math.sin(shoulderAngle) * armpitDrop,
      y: midShoulder.y - Math.sin(shoulderAngle) * chestWidthHalf * leftPerspective + Math.cos(shoulderAngle) * armpitDrop,
    };
    const v8 = {
      x: midShoulder.x + Math.cos(shoulderAngle) * chestWidthHalf * rightPerspective + Math.sin(shoulderAngle) * armpitDrop,
      y: midShoulder.y + Math.sin(shoulderAngle) * chestWidthHalf * rightPerspective + Math.cos(shoulderAngle) * armpitDrop,
    };

    // 9: Sternum / 3D Chest Center Arch
    // Pushes slightly outward perpendicular to shoulder plane for 3D chest curvature
    const sternumDrop = fullTorsoLen * 0.33;
    const chestArch = shoulderWidth * 0.04 * params.depthExtrusion;
    const v9 = {
      x: midShoulder.x + Math.sin(shoulderAngle) * (sternumDrop + chestArch),
      y: midShoulder.y + Math.cos(shoulderAngle) * (sternumDrop + chestArch),
    };

    // 10, 11: Mid Torso / Ribs
    const ribDrop = fullTorsoLen * 0.62;
    const ribWidthHalf = chestWidthHalf * params.waistFlare;

    const v10 = {
      x: midShoulder.x - Math.cos(shoulderAngle) * ribWidthHalf * leftPerspective + Math.sin(shoulderAngle) * ribDrop,
      y: midShoulder.y - Math.sin(shoulderAngle) * ribWidthHalf * leftPerspective + Math.cos(shoulderAngle) * ribDrop,
    };
    const v11 = {
      x: midShoulder.x + Math.cos(shoulderAngle) * ribWidthHalf * rightPerspective + Math.sin(shoulderAngle) * ribDrop,
      y: midShoulder.y + Math.sin(shoulderAngle) * ribWidthHalf * rightPerspective + Math.cos(shoulderAngle) * ribDrop,
    };

    // 12, 13, 14: Lower Hemline
    const hemDrop = fullTorsoLen;
    const hemWidthHalf = ribWidthHalf * 1.04;

    const v12 = {
      x: midShoulder.x - Math.cos(shoulderAngle) * hemWidthHalf * leftPerspective + Math.sin(shoulderAngle) * hemDrop,
      y: midShoulder.y - Math.sin(shoulderAngle) * hemWidthHalf * leftPerspective + Math.cos(shoulderAngle) * hemDrop,
    };
    const v13 = {
      x: midShoulder.x + Math.cos(shoulderAngle) * hemWidthHalf * rightPerspective + Math.sin(shoulderAngle) * hemDrop,
      y: midShoulder.y + Math.sin(shoulderAngle) * hemWidthHalf * rightPerspective + Math.cos(shoulderAngle) * hemDrop,
    };
    const v14 = {
      x: (v12.x + v13.x) / 2 + Math.sin(shoulderAngle) * (shoulderWidth * 0.04),
      y: (v12.y + v13.y) / 2 + Math.cos(shoulderAngle) * (shoulderWidth * 0.04),
    };

    const rawCoords = [v0, v1, v2, v3, v4, v5, v6, v7, v8, v9, v10, v11, v12, v13, v14];

    return rawCoords.map((coord, idx) => ({
      x: coord.x,
      y: coord.y,
      u: TriangulatedGarmentMeshEngine.BASE_UVS[idx].u,
      v: TriangulatedGarmentMeshEngine.BASE_UVS[idx].v,
    }));
  }

  /**
   * Renders the deformed triangulated mesh with 3D volumetric lighting and fabric contouring.
   */
  public renderMesh(
    ctx: CanvasRenderingContext2D,
    vertices: MeshVertex[],
    canvasWidth: number,
    canvasHeight: number,
    video?: HTMLVideoElement | null,
    isMirrored: boolean = true
  ): void {
    if (!this.garmentImage || !this.isLoaded || vertices.length < 15) return;

    // 1. Draw all triangulated mesh facets with 2D affine warp
    for (const tri of TriangulatedGarmentMeshEngine.TRIANGLES) {
      const p0 = vertices[tri.i0];
      const p1 = vertices[tri.i1];
      const p2 = vertices[tri.i2];
      drawAffineTriangle(ctx, this.garmentImage, p0, p1, p2);
    }

    // 2. Realistic 3D Torso Volumetric Shading
    // Enhances the 3D cylindrical wrap of the shirt around the user's ribs
    const pLeft = vertices[7]; // left armpit
    const pRight = vertices[8]; // right armpit
    const pSternum = vertices[9]; // center chest

    if (pLeft && pRight) {
      const grad = ctx.createLinearGradient(pLeft.x, pLeft.y, pRight.x, pRight.y);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.35)');
      grad.addColorStop(0.22, 'rgba(0, 0, 0, 0.03)');
      grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.08)'); // subtle center highlight
      grad.addColorStop(0.78, 'rgba(0, 0, 0, 0.03)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.35)');

      ctx.save();
      // Restrict shading precisely to the garment silhouette
      ctx.beginPath();
      ctx.moveTo(vertices[0].x, vertices[0].y);
      ctx.lineTo(vertices[2].x, vertices[2].y);
      ctx.lineTo(vertices[4].x, vertices[4].y);
      ctx.lineTo(vertices[8].x, vertices[8].y);
      ctx.lineTo(vertices[11].x, vertices[11].y);
      ctx.lineTo(vertices[13].x, vertices[13].y);
      ctx.lineTo(vertices[14].x, vertices[14].y);
      ctx.lineTo(vertices[12].x, vertices[12].y);
      ctx.lineTo(vertices[10].x, vertices[10].y);
      ctx.lineTo(vertices[7].x, vertices[7].y);
      ctx.lineTo(vertices[3].x, vertices[3].y);
      ctx.closePath();
      ctx.clip();

      ctx.fillStyle = grad;
      ctx.fill();

      // Realistic under-collar shadow for natural depth between neck and shirt
      const neckShadow = ctx.createRadialGradient(
        pSternum.x, pSternum.y * 0.88, 4,
        pSternum.x, pSternum.y, pSternum.y * 0.45
      );
      neckShadow.addColorStop(0, 'rgba(0, 0, 0, 0.32)');
      neckShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = neckShadow;
      ctx.fill();

      ctx.restore();
    }
  }
}
