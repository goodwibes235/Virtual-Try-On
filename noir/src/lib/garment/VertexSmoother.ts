import { MeshVertex } from './AffineWarp';

export class VertexSmoother {
  private prevVertices: MeshVertex[] | null = null;
  private alpha: number;
  private missingFrames: number = 0;
  private maxMissingFrames: number = 8;

  constructor(alpha: number = 0.35) {
    this.alpha = alpha;
  }

  public smooth(current: MeshVertex[] | null): MeshVertex[] | null {
    if (!current) {
      this.missingFrames++;
      if (this.missingFrames > this.maxMissingFrames) {
        this.prevVertices = null;
      }
      return null;
    }

    this.missingFrames = 0;

    if (!this.prevVertices || this.prevVertices.length !== current.length) {
      this.prevVertices = current.map((v) => ({ ...v }));
      return current;
    }

    const smoothed: MeshVertex[] = current.map((v, i) => {
      const prev = this.prevVertices![i];
      return {
        x: prev.x + (v.x - prev.x) * this.alpha,
        y: prev.y + (v.y - prev.y) * this.alpha,
        u: v.u,
        v: v.v,
      };
    });

    this.prevVertices = smoothed.map((v) => ({ ...v }));
    return smoothed;
  }

  public reset(): void {
    this.prevVertices = null;
    this.missingFrames = 0;
  }
}

