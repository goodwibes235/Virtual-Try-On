import { GarmentMesh, Point2D } from './GarmentMeshDeformer';

export class RealisticGarmentRenderer {
  private garmentImage: HTMLImageElement | null = null;
  private isLoaded: boolean = false;
  private currentPath: string = '';

  public async loadGarment(path: string): Promise<void> {
    if (this.currentPath === path && this.isLoaded) return;

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = path;
      img.onload = () => {
        this.garmentImage = img;
        this.isLoaded = true;
        this.currentPath = path;
        resolve();
      };
      img.onerror = (e) => {
        console.error('Failed to load garment texture:', path, e);
        reject(e);
      };
    });
  }

  /**
   * Performs realistic mesh-based affine deformation:
   * 1. Constructs dynamic garment contour from mesh vertices.
   * 2. Maps the authentic shirt fabric with affine transformation adjusted to shoulder width, torso length & lean.
   * 3. Applies anatomical fabric shading (folds, ambient chest occlusion, side shadows).
   * 4. Handles arm occlusion so arms in front of the torso layer naturally.
   */
  public renderDeformedGarment(
    ctx: CanvasRenderingContext2D,
    mesh: GarmentMesh,
    canvasWidth: number,
    canvasHeight: number,
    rawVideo?: HTMLVideoElement | null,
    isMirrored: boolean = true
  ): void {
    if (!mesh.isValid || !this.garmentImage || !this.isLoaded) return;

    ctx.save();

    // 1. Create smooth anatomical clipping path from deformed vertices
    ctx.beginPath();

    // Start at collar left
    ctx.moveTo(mesh.collarLeft.x, mesh.collarLeft.y);

    // Collar neckline curve (concave dip around neck)
    ctx.quadraticCurveTo(
      mesh.collarCenter.x,
      mesh.collarCenter.y,
      mesh.collarRight.x,
      mesh.collarRight.y
    );

    // Right shoulder seam
    ctx.lineTo(mesh.rightShoulder.x, mesh.rightShoulder.y);

    // Right sleeve
    ctx.lineTo(mesh.rightOuterSleeve.x, mesh.rightOuterSleeve.y);
    ctx.lineTo(mesh.rightArmpit.x, mesh.rightArmpit.y);

    // Right side seam & waist contour
    ctx.quadraticCurveTo(
      mesh.rightWaist.x,
      mesh.rightWaist.y,
      mesh.rightHem.x,
      mesh.rightHem.y
    );

    // Bottom hem curve
    ctx.quadraticCurveTo(
      mesh.hemCenter.x,
      mesh.hemCenter.y,
      mesh.leftHem.x,
      mesh.leftHem.y
    );

    // Left side seam & waist contour
    ctx.quadraticCurveTo(
      mesh.leftWaist.x,
      mesh.leftWaist.y,
      mesh.leftArmpit.x,
      mesh.leftArmpit.y
    );

    // Left sleeve
    ctx.lineTo(mesh.leftOuterSleeve.x, mesh.leftOuterSleeve.y);
    ctx.lineTo(mesh.leftShoulder.x, mesh.leftShoulder.y);

    ctx.closePath();

    // Restrict drawing to the deformed garment silhouette
    ctx.clip();

    // 2. Draw fabric texture with dynamic scaling & orientation
    const midShoulderX = (mesh.leftShoulder.x + mesh.rightShoulder.x) / 2;
    const midShoulderY = (mesh.leftShoulder.y + mesh.rightShoulder.y) / 2;

    const spanX = mesh.rightOuterSleeve.x - mesh.leftOuterSleeve.x;
    const spanY = mesh.rightOuterSleeve.y - mesh.leftOuterSleeve.y;
    const fullWidth = Math.sqrt(spanX * spanX + spanY * spanY) * 1.08;
    const fullHeight = mesh.torsoHeight * 1.55;

    ctx.save();
    ctx.translate(midShoulderX, midShoulderY);
    ctx.rotate(mesh.bodyAngle);

    // Draw textured garment
    ctx.drawImage(
      this.garmentImage,
      -fullWidth / 2,
      -fullHeight * 0.12,
      fullWidth,
      fullHeight
    );

    // 3. Realistic Fabric Shading & Volume Rendering
    // Ambient side shadows (giving 3D cylindrical chest contour)
    const sideShadow = ctx.createLinearGradient(-fullWidth / 2, 0, fullWidth / 2, 0);
    sideShadow.addColorStop(0, 'rgba(0,0,0,0.35)');
    sideShadow.addColorStop(0.18, 'rgba(0,0,0,0.02)');
    sideShadow.addColorStop(0.5, 'rgba(255,255,255,0.06)'); // subtle chest highlight
    sideShadow.addColorStop(0.82, 'rgba(0,0,0,0.02)');
    sideShadow.addColorStop(1, 'rgba(0,0,0,0.35)');

    ctx.fillStyle = sideShadow;
    ctx.fillRect(-fullWidth / 2, -fullHeight * 0.12, fullWidth, fullHeight);

    // Under-armpit & lower-torso gradient shadow
    const verticalShade = ctx.createLinearGradient(0, -fullHeight * 0.12, 0, fullHeight);
    verticalShade.addColorStop(0, 'rgba(0,0,0,0.15)'); // collar shadow
    verticalShade.addColorStop(0.25, 'rgba(0,0,0,0.0)');
    verticalShade.addColorStop(0.85, 'rgba(0,0,0,0.05)');
    verticalShade.addColorStop(1, 'rgba(0,0,0,0.25)'); // hem fold shadow

    ctx.fillStyle = verticalShade;
    ctx.fillRect(-fullWidth / 2, -fullHeight * 0.12, fullWidth, fullHeight);

    ctx.restore(); // restore local translation/rotation
    ctx.restore(); // restore clipping path

    // 4. Arm Occlusion Layering:
    // When user brings arms across chest, layer the user's actual arms/hands OVER the shirt
    if (rawVideo && rawVideo.readyState >= 2) {
      this.renderArmOcclusion(ctx, mesh, rawVideo, canvasWidth, canvasHeight, isMirrored);
    }
  }

  /**
   * Copies camera video frames along detected arm segments so forearms & hands
   * sit naturally OVER the garment instead of being concealed underneath it.
   */
  private renderArmOcclusion(
    ctx: CanvasRenderingContext2D,
    mesh: GarmentMesh,
    video: HTMLVideoElement,
    canvasWidth: number,
    canvasHeight: number,
    isMirrored: boolean
  ): void {
    const forearms = [mesh.leftForearm, mesh.rightForearm];

    for (const arm of forearms) {
      if (!arm.visible) continue;

      const dx = arm.end.x - arm.start.x;
      const dy = arm.end.y - arm.start.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 15) continue;

      // Arm pill width
      const armWidth = Math.min(36, dist * 0.28);

      ctx.save();
      ctx.beginPath();
      // Draw rounded capsule along forearm
      const angle = Math.atan2(dy, dx);
      const nx = -Math.sin(angle) * armWidth * 0.5;
      const ny = Math.cos(angle) * armWidth * 0.5;

      ctx.moveTo(arm.start.x + nx, arm.start.y + ny);
      ctx.lineTo(arm.end.x + nx, arm.end.y + ny);
      ctx.arc(arm.end.x, arm.end.y, armWidth * 0.5, angle - Math.PI / 2, angle + Math.PI / 2);
      ctx.lineTo(arm.start.x - nx, arm.start.y - ny);
      ctx.arc(arm.start.x, arm.start.y, armWidth * 0.5, angle + Math.PI / 2, angle - Math.PI / 2);
      ctx.closePath();

      ctx.clip();

      // Draw real camera feed inside the arm capsule so arm is on top of shirt
      ctx.save();
      if (isMirrored) {
        ctx.translate(canvasWidth, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvasWidth, canvasHeight);
      ctx.restore();

      ctx.restore();
    }
  }
}

