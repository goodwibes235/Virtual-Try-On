import { GarmentPlacement } from './GarmentFitting';

export class GarmentRenderer {
  private garmentImage: HTMLImageElement | null = null;
  private imageLoaded: boolean = false;
  private currentAssetPath: string = '';

  public async loadGarment(assetPath: string): Promise<void> {
    if (this.currentAssetPath === assetPath && this.imageLoaded) {
      return;
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = assetPath;
      img.onload = () => {
        this.garmentImage = img;
        this.imageLoaded = true;
        this.currentAssetPath = assetPath;
        resolve();
      };
      img.onerror = (e) => {
        console.error('Failed to load garment image asset:', assetPath, e);
        reject(e);
      };
    });
  }

  /**
   * Renders the garment centered at (placement.x, placement.y)
   * with proper rotation angle and dimension scaling.
   */
  public render(
    ctx: CanvasRenderingContext2D,
    placement: GarmentPlacement,
    canvasWidth: number,
    canvasHeight: number
  ): void {
    if (!placement.isValid || !this.garmentImage || !this.imageLoaded) {
      return;
    }

    const { x, y, width, height, angle } = placement;

    ctx.save();

    // 1. Translate to garment anchor point (collar / upper-torso center)
    ctx.translate(x, y);

    // 2. Rotate according to user's body inclination
    ctx.rotate(angle);

    // 3. Draw garment centered horizontally at origin, with collar near top
    const halfWidth = width / 2;
    // We let the collar start at y: 0 and hang down to y: height
    ctx.drawImage(this.garmentImage, -halfWidth, 0, width, height);

    ctx.restore();
  }

  public isReady(): boolean {
    return this.imageLoaded;
  }
}

