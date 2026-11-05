import { ExtractedBodyLandmarks } from '@/lib/pose/PoseDetection';

export interface Point2D {
  x: number;
  y: number;
}

export interface GarmentMesh {
  // Key control vertices in screen coordinates
  collarLeft: Point2D;
  collarCenter: Point2D;
  collarRight: Point2D;
  
  leftShoulder: Point2D;
  rightShoulder: Point2D;
  
  leftOuterSleeve: Point2D;
  rightOuterSleeve: Point2D;
  
  leftArmpit: Point2D;
  rightArmpit: Point2D;
  
  leftWaist: Point2D;
  rightWaist: Point2D;
  
  leftHem: Point2D;
  hemCenter: Point2D;
  rightHem: Point2D;

  // Deformation metadata
  chestWidth: number;
  torsoHeight: number;
  bodyAngle: number;
  bodyLeanAngle: number;
  confidence: number;
  isValid: boolean;
  
  // Arm occlusion vectors for layering
  leftForearm: { start: Point2D; end: Point2D; visible: boolean };
  rightForearm: { start: Point2D; end: Point2D; visible: boolean };
}

export interface FitParameters {
  shoulderDrape: number;     // Multiplier for dropped shoulders (e.g. 1.25 for oversized)
  chestEase: number;         // Multiplier for chest girth
  waistTaper: number;        // Waist tapering (0.95 = tapered, 1.05 = boxy/oversized)
  hemLength: number;         // Torso coverage multiplier (1.1 - 1.3)
  sleeveLengthRatio: number; // Ratio of shoulder-to-elbow length (0.5 for tee, 0.9 for long-sleeve)
  collarDip: number;         // Neck drop offset
}

export class GarmentMeshDeformer {
  private fitParams: FitParameters;

  constructor(fitParams?: Partial<FitParameters>) {
    this.fitParams = {
      shoulderDrape: fitParams?.shoulderDrape ?? 1.15,
      chestEase: fitParams?.chestEase ?? 1.12,
      waistTaper: fitParams?.waistTaper ?? 1.0,
      hemLength: fitParams?.hemLength ?? 1.25,
      sleeveLengthRatio: fitParams?.sleeveLengthRatio ?? 0.55,
      collarDip: fitParams?.collarDip ?? 0.12,
    };
  }

  public updateFitParams(fitParams: Partial<FitParameters>) {
    this.fitParams = { ...this.fitParams, ...fitParams };
  }

  /**
   * Generates a 2D quad/mesh lattice from 3D body tracking landmarks.
   * This deforms the garment dynamically to the user's posture, shoulders,
   * chest curvature, spine tilt, and elbow flexion.
   */
  public generateMesh(
    landmarks: ExtractedBodyLandmarks,
    canvasWidth: number,
    canvasHeight: number,
    isMirrored: boolean
  ): GarmentMesh {
    const {
      leftShoulder,
      rightShoulder,
      leftElbow,
      rightElbow,
      leftWrist,
      rightWrist,
      leftHip,
      rightHip,
      neck,
      nose,
    } = landmarks;

    const minVis = 0.45;
    if (leftShoulder.visibility < minVis || rightShoulder.visibility < minVis) {
      return this.emptyMesh();
    }

    const tx = (val: number) => (isMirrored ? (1 - val) * canvasWidth : val * canvasWidth);
    const ty = (val: number) => val * canvasHeight;

    const ls = { x: tx(leftShoulder.x), y: ty(leftShoulder.y) };
    const rs = { x: tx(rightShoulder.x), y: ty(rightShoulder.y) };
    const le = { x: tx(leftElbow.x), y: ty(leftElbow.y) };
    const re = { x: tx(rightElbow.x), y: ty(rightElbow.y) };
    const lw = { x: tx(leftWrist.x), y: ty(leftWrist.y) };
    const rw = { x: tx(rightWrist.x), y: ty(rightWrist.y) };
    const lh = { x: tx(leftHip.x), y: ty(leftHip.y) };
    const rh = { x: tx(rightHip.x), y: ty(rightHip.y) };
    const nk = { x: tx(neck.x), y: ty(neck.y) };

    // 1. Calculate primary body geometry vectors
    const shoulderDx = rs.x - ls.x;
    const shoulderDy = rs.y - ls.y;
    const shoulderSpan = Math.sqrt(shoulderDx * shoulderDx + shoulderDy * shoulderDy);
    const shoulderAngle = Math.atan2(shoulderDy, shoulderDx);

    // Shoulder midpoint
    const midShoulder = {
      x: (ls.x + rs.x) / 2,
      y: (ls.y + rs.y) / 2,
    };

    // Hip midpoint & torso length
    let midHip = {
      x: midShoulder.x,
      y: midShoulder.y + shoulderSpan * 1.3,
    };

    let actualTorsoLength = shoulderSpan * 1.3;
    if (leftHip.visibility > minVis && rightHip.visibility > minVis) {
      midHip = {
        x: (lh.x + rh.x) / 2,
        y: (lh.y + rh.y) / 2,
      };
      const tDx = midHip.x - midShoulder.x;
      const tDy = midHip.y - midShoulder.y;
      actualTorsoLength = Math.sqrt(tDx * tDx + tDy * tDy);
    }

    // Spine inclination vector (for torso rotation / leaning)
    const spineAngle = Math.atan2(midHip.y - midShoulder.y, midHip.x - midShoulder.x);

    // 2. Collar & Neckline positioning
    const collarRadius = shoulderSpan * 0.16;
    const collarDipDist = shoulderSpan * this.fitParams.collarDip;

    const collarLeft: Point2D = {
      x: midShoulder.x - Math.cos(shoulderAngle) * collarRadius,
      y: midShoulder.y - Math.sin(shoulderAngle) * collarRadius,
    };
    const collarRight: Point2D = {
      x: midShoulder.x + Math.cos(shoulderAngle) * collarRadius,
      y: midShoulder.y + Math.sin(shoulderAngle) * collarRadius,
    };
    const collarCenter: Point2D = {
      x: midShoulder.x + Math.sin(shoulderAngle) * collarDipDist,
      y: midShoulder.y + Math.cos(shoulderAngle) * collarDipDist,
    };

    // 3. Deformed Shoulder Points (with natural fabric drape extension)
    const drapeDist = shoulderSpan * (this.fitParams.shoulderDrape - 1.0) * 0.5;
    const deformedLeftShoulder: Point2D = {
      x: ls.x - Math.cos(shoulderAngle) * drapeDist,
      y: ls.y - Math.sin(shoulderAngle) * drapeDist,
    };
    const deformedRightShoulder: Point2D = {
      x: rs.x + Math.cos(shoulderAngle) * drapeDist,
      y: rs.y + Math.sin(shoulderAngle) * drapeDist,
    };

    // 4. Sleeves following actual arm/elbow vectors
    // Left Sleeve: from left shoulder towards left elbow
    const lArmDx = le.x - ls.x;
    const lArmDy = le.y - ls.y;
    const lArmDist = Math.max(10, Math.sqrt(lArmDx * lArmDx + lArmDy * lArmDy));
    const lArmNormX = lArmDx / lArmDist;
    const lArmNormY = lArmDy / lArmDist;

    const sleeveLengthL = Math.min(lArmDist * this.fitParams.sleeveLengthRatio, shoulderSpan * 0.6);
    const leftOuterSleeve: Point2D = {
      x: deformedLeftShoulder.x + lArmNormX * sleeveLengthL,
      y: deformedLeftShoulder.y + lArmNormY * sleeveLengthL,
    };

    // Right Sleeve: from right shoulder towards right elbow
    const rArmDx = re.x - rs.x;
    const rArmDy = re.y - rs.y;
    const rArmDist = Math.max(10, Math.sqrt(rArmDx * rArmDx + rArmDy * rArmDy));
    const rArmNormX = rArmDx / rArmDist;
    const rArmNormY = rArmDy / rArmDist;

    const sleeveLengthR = Math.min(rArmDist * this.fitParams.sleeveLengthRatio, shoulderSpan * 0.6);
    const rightOuterSleeve: Point2D = {
      x: deformedRightShoulder.x + rArmNormX * sleeveLengthR,
      y: deformedRightShoulder.y + rArmNormY * sleeveLengthR,
    };

    // 5. Armpits and Chest Points
    const chestWidth = shoulderSpan * this.fitParams.chestEase;
    const armpitDrop = actualTorsoLength * 0.28;

    const leftArmpit: Point2D = {
      x: midShoulder.x - Math.cos(shoulderAngle) * (chestWidth * 0.5) + Math.sin(shoulderAngle) * armpitDrop,
      y: midShoulder.y - Math.sin(shoulderAngle) * (chestWidth * 0.5) + Math.cos(shoulderAngle) * armpitDrop,
    };
    const rightArmpit: Point2D = {
      x: midShoulder.x + Math.cos(shoulderAngle) * (chestWidth * 0.5) + Math.sin(shoulderAngle) * armpitDrop,
      y: midShoulder.y + Math.sin(shoulderAngle) * (chestWidth * 0.5) + Math.cos(shoulderAngle) * armpitDrop,
    };

    // 6. Waist & Hemline with natural torso contouring
    const waistDrop = actualTorsoLength * 0.65;
    const waistWidth = chestWidth * this.fitParams.waistTaper;

    const leftWaist: Point2D = {
      x: midShoulder.x - Math.cos(shoulderAngle) * (waistWidth * 0.5) + Math.sin(shoulderAngle) * waistDrop,
      y: midShoulder.y - Math.sin(shoulderAngle) * (waistWidth * 0.5) + Math.cos(shoulderAngle) * waistDrop,
    };
    const rightWaist: Point2D = {
      x: midShoulder.x + Math.cos(shoulderAngle) * (waistWidth * 0.5) + Math.sin(shoulderAngle) * waistDrop,
      y: midShoulder.y + Math.sin(shoulderAngle) * (waistWidth * 0.5) + Math.cos(shoulderAngle) * waistDrop,
    };

    const hemDrop = actualTorsoLength * this.fitParams.hemLength;
    const hemWidth = chestWidth * (this.fitParams.waistTaper * 1.05);

    const leftHem: Point2D = {
      x: midShoulder.x - Math.cos(shoulderAngle) * (hemWidth * 0.5) + Math.sin(shoulderAngle) * hemDrop,
      y: midShoulder.y - Math.sin(shoulderAngle) * (hemWidth * 0.5) + Math.cos(shoulderAngle) * hemDrop,
    };
    const rightHem: Point2D = {
      x: midShoulder.x + Math.cos(shoulderAngle) * (hemWidth * 0.5) + Math.sin(shoulderAngle) * hemDrop,
      y: midShoulder.y + Math.sin(shoulderAngle) * (hemWidth * 0.5) + Math.cos(shoulderAngle) * hemDrop,
    };
    const hemCenter: Point2D = {
      x: (leftHem.x + rightHem.x) / 2 + Math.sin(shoulderAngle) * (shoulderSpan * 0.05),
      y: (leftHem.y + rightHem.y) / 2 + Math.cos(shoulderAngle) * (shoulderSpan * 0.05),
    };

    // Forearm segments for occlusion checks (wrist over shirt)
    const leftForearm = {
      start: le,
      end: lw,
      visible: leftElbow.visibility > minVis && leftWrist.visibility > minVis,
    };
    const rightForearm = {
      start: re,
      end: rw,
      visible: rightElbow.visibility > minVis && rightWrist.visibility > minVis,
    };

    const confidence = (leftShoulder.visibility + rightShoulder.visibility) / 2;

    return {
      collarLeft,
      collarCenter,
      collarRight,
      leftShoulder: deformedLeftShoulder,
      rightShoulder: deformedRightShoulder,
      leftOuterSleeve,
      rightOuterSleeve,
      leftArmpit,
      rightArmpit,
      leftWaist,
      rightWaist,
      leftHem,
      hemCenter,
      rightHem,
      chestWidth,
      torsoHeight: actualTorsoLength,
      bodyAngle: shoulderAngle,
      bodyLeanAngle: spineAngle,
      confidence,
      isValid: true,
      leftForearm,
      rightForearm,
    };
  }

  private emptyMesh(): GarmentMesh {
    const zero = { x: 0, y: 0 };
    return {
      collarLeft: zero,
      collarCenter: zero,
      collarRight: zero,
      leftShoulder: zero,
      rightShoulder: zero,
      leftOuterSleeve: zero,
      rightOuterSleeve: zero,
      leftArmpit: zero,
      rightArmpit: zero,
      leftWaist: zero,
      rightWaist: zero,
      leftHem: zero,
      hemCenter: zero,
      rightHem: zero,
      chestWidth: 0,
      torsoHeight: 0,
      bodyAngle: 0,
      bodyLeanAngle: 0,
      confidence: 0,
      isValid: false,
      leftForearm: { start: zero, end: zero, visible: false },
      rightForearm: { start: zero, end: zero, visible: false },
    };
  }
}

