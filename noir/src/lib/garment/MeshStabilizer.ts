import { GarmentMesh, Point2D } from './GarmentMeshDeformer';

export class MeshStabilizer {
  private prevMesh: GarmentMesh | null = null;
  private alpha: number;
  private missingFrames: number = 0;
  private maxMissingFrames: number = 8;

  constructor(alpha: number = 0.32) {
    this.alpha = alpha;
  }

  public update(current: GarmentMesh): GarmentMesh {
    if (!current.isValid) {
      this.missingFrames++;
      if (this.missingFrames > this.maxMissingFrames) {
        this.prevMesh = null;
      }
      return current;
    }

    this.missingFrames = 0;

    if (!this.prevMesh) {
      this.prevMesh = JSON.parse(JSON.stringify(current));
      return current;
    }

    const lerpPt = (p1: Point2D, p2: Point2D, a: number): Point2D => ({
      x: p1.x + (p2.x - p1.x) * a,
      y: p1.y + (p2.y - p1.y) * a,
    });

    const lerpVal = (v1: number, v2: number, a: number) => v1 + (v2 - v1) * a;

    const smoothed: GarmentMesh = {
      collarLeft: lerpPt(this.prevMesh.collarLeft, current.collarLeft, this.alpha),
      collarCenter: lerpPt(this.prevMesh.collarCenter, current.collarCenter, this.alpha),
      collarRight: lerpPt(this.prevMesh.collarRight, current.collarRight, this.alpha),
      leftShoulder: lerpPt(this.prevMesh.leftShoulder, current.leftShoulder, this.alpha),
      rightShoulder: lerpPt(this.prevMesh.rightShoulder, current.rightShoulder, this.alpha),
      leftOuterSleeve: lerpPt(this.prevMesh.leftOuterSleeve, current.leftOuterSleeve, this.alpha),
      rightOuterSleeve: lerpPt(this.prevMesh.rightOuterSleeve, current.rightOuterSleeve, this.alpha),
      leftArmpit: lerpPt(this.prevMesh.leftArmpit, current.leftArmpit, this.alpha),
      rightArmpit: lerpPt(this.prevMesh.rightArmpit, current.rightArmpit, this.alpha),
      leftWaist: lerpPt(this.prevMesh.leftWaist, current.leftWaist, this.alpha),
      rightWaist: lerpPt(this.prevMesh.rightWaist, current.rightWaist, this.alpha),
      leftHem: lerpPt(this.prevMesh.leftHem, current.leftHem, this.alpha),
      hemCenter: lerpPt(this.prevMesh.hemCenter, current.hemCenter, this.alpha),
      rightHem: lerpPt(this.prevMesh.rightHem, current.rightHem, this.alpha),
      chestWidth: lerpVal(this.prevMesh.chestWidth, current.chestWidth, this.alpha),
      torsoHeight: lerpVal(this.prevMesh.torsoHeight, current.torsoHeight, this.alpha),
      bodyAngle: lerpVal(this.prevMesh.bodyAngle, current.bodyAngle, this.alpha),
      bodyLeanAngle: lerpVal(this.prevMesh.bodyLeanAngle, current.bodyLeanAngle, this.alpha),
      confidence: current.confidence,
      isValid: true,
      leftForearm: current.leftForearm,
      rightForearm: current.rightForearm,
    };

    this.prevMesh = JSON.parse(JSON.stringify(smoothed));
    return smoothed;
  }

  public reset(): void {
    this.prevMesh = null;
    this.missingFrames = 0;
  }
}

