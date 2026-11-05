import { ExtractedBodyLandmarks } from '@/lib/pose/PoseDetection';

export interface GarmentPlacement {
  x: number; // canvas x (top-left of garment)
  y: number; // canvas y (top-left of garment)
  width: number;
  height: number;
  angle: number; // radians
  scale: number;
  confidence: number;
  isValid: boolean;
}

export interface GarmentFittingOptions {
  widthMultiplier?: number;  // Multiplier relative to shoulder width (e.g. 1.8 for oversized)
  heightMultiplier?: number; // Multiplier relative to torso height
  verticalOffsetRatio?: number; // How far up from shoulder center the collar sits
}

export class GarmentFitting {
  private widthMultiplier: number;
  private heightMultiplier: number;
  private verticalOffsetRatio: number;

  constructor(options?: GarmentFittingOptions) {
    this.widthMultiplier = options?.widthMultiplier ?? 1.9;
    this.heightMultiplier = options?.heightMultiplier ?? 1.35;
    this.verticalOffsetRatio = options?.verticalOffsetRatio ?? 0.16;
  }

  /**
   * Calculates the scale, orientation angle, and screen coordinates
   * to position the garment naturally over the detected human body.
   */
  public computePlacement(
    landmarks: ExtractedBodyLandmarks,
    canvasWidth: number,
    canvasHeight: number,
    isMirrored: boolean
  ): GarmentPlacement {
    const { leftShoulder, rightShoulder, leftHip, rightHip } = landmarks;

    // Minimum visibility check
    const minVis = 0.45;
    if (leftShoulder.visibility < minVis || rightShoulder.visibility < minVis) {
      return {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        angle: 0,
        scale: 1,
        confidence: 0,
        isValid: false,
      };
    }

    const transformX = (x: number) => (isMirrored ? (1 - x) * canvasWidth : x * canvasWidth);
    const transformY = (y: number) => y * canvasHeight;

    const lsX = transformX(leftShoulder.x);
    const lsY = transformY(leftShoulder.y);
    const rsX = transformX(rightShoulder.x);
    const rsY = transformY(rightShoulder.y);

    // Shoulder center point
    const shoulderCenterX = (lsX + rsX) / 2;
    const shoulderCenterY = (lsY + rsY) / 2;

    // Measured shoulder width
    const dx = rsX - lsX;
    const dy = rsY - lsY;
    const shoulderWidth = Math.sqrt(dx * dx + dy * dy);

    // Body tilt angle based on shoulder line
    const angle = Math.atan2(dy, dx);

    // Torso height estimation using hips if visible, or fallback aspect ratio
    let torsoHeight = shoulderWidth * 1.25;
    if (leftHip.visibility > minVis && rightHip.visibility > minVis) {
      const lhX = transformX(leftHip.x);
      const lhY = transformY(leftHip.y);
      const rhX = transformX(rightHip.x);
      const rhY = transformY(rightHip.y);

      const hipCenterX = (lhX + rhX) / 2;
      const hipCenterY = (lhY + rhY) / 2;

      const tdx = hipCenterX - shoulderCenterX;
      const tdy = hipCenterY - shoulderCenterY;
      torsoHeight = Math.sqrt(tdx * tdx + tdy * tdy);
    }

    // Calculated garment box dimensions
    const garmentWidth = shoulderWidth * this.widthMultiplier;
    const garmentHeight = torsoHeight * this.heightMultiplier;

    // Anchor: collar sits slightly above the shoulder center line
    const collarOffsetY = garmentHeight * this.verticalOffsetRatio;

    const confidence = (leftShoulder.visibility + rightShoulder.visibility) / 2;

    return {
      x: shoulderCenterX,
      y: shoulderCenterY - collarOffsetY,
      width: garmentWidth,
      height: garmentHeight,
      angle: angle,
      scale: garmentWidth / 500, // Normalized against base garment asset size
      confidence,
      isValid: true,
    };
  }
}

