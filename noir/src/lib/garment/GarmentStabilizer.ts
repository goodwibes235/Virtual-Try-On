import { GarmentPlacement } from './GarmentFitting';

export interface SmoothedPlacement extends GarmentPlacement {
  isStable: boolean;
}

export class GarmentStabilizer {
  private previousPlacement: GarmentPlacement | null = null;
  private alpha: number; // Exponential moving average factor (0.1 = very smooth, 0.4 = responsive)
  private missingFrames: number = 0;
  private maxMissingFrames: number = 10;

  constructor(alpha: number = 0.28) {
    this.alpha = alpha;
  }

  public update(current: GarmentPlacement): GarmentPlacement {
    if (!current.isValid) {
      this.missingFrames++;
      if (this.missingFrames > this.maxMissingFrames) {
        this.previousPlacement = null; // Reset if user walked away
      }
      return current;
    }

    this.missingFrames = 0;

    if (!this.previousPlacement) {
      this.previousPlacement = { ...current };
      return current;
    }

    // Exponential Moving Average filter on all parameters
    const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;

    const smoothed: GarmentPlacement = {
      x: lerp(this.previousPlacement.x, current.x, this.alpha),
      y: lerp(this.previousPlacement.y, current.y, this.alpha),
      width: lerp(this.previousPlacement.width, current.width, this.alpha),
      height: lerp(this.previousPlacement.height, current.height, this.alpha),
      angle: lerp(this.previousPlacement.angle, current.angle, this.alpha),
      scale: lerp(this.previousPlacement.scale, current.scale, this.alpha),
      confidence: current.confidence,
      isValid: true,
    };

    this.previousPlacement = { ...smoothed };
    return smoothed;
  }

  public reset(): void {
    this.previousPlacement = null;
    this.missingFrames = 0;
  }
}

