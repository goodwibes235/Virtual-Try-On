export interface CameraOptions {
  videoElement: HTMLVideoElement;
  facingMode?: 'user' | 'environment';
  width?: number;
  height?: number;
  onStreamReady?: (stream: MediaStream) => void;
  onError?: (error: Error) => void;
}

export class CameraManager {
  private video: HTMLVideoElement | null = null;
  private stream: MediaStream | null = null;
  private facingMode: 'user' | 'environment' = 'user';
  private isMirrored: boolean = true;

  constructor(options?: Partial<CameraOptions>) {
    if (options?.facingMode) {
      this.facingMode = options.facingMode;
    }
  }

  public async start(videoElement: HTMLVideoElement): Promise<MediaStream> {
    this.video = videoElement;
    this.stop(); // Stop any existing stream first

    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: this.facingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    };

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.video.srcObject = this.stream;
      this.video.playsInline = true;
      this.video.muted = true;

      await new Promise<void>((resolve) => {
        if (!this.video) return resolve();
        this.video.onloadedmetadata = () => {
          this.video?.play().then(() => resolve()).catch(() => resolve());
        };
      });

      return this.stream;
    } catch (err: any) {
      const error = new Error(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in your browser.'
          : err.name === 'NotFoundError'
          ? 'No camera found on this device.'
          : 'Unable to access camera: ' + err.message
      );
      throw error;
    }
  }

  public stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
    }
  }

  public toggleMirror(): boolean {
    this.isMirrored = !this.isMirrored;
    return this.isMirrored;
  }

  public async switchCamera(): Promise<MediaStream | null> {
    if (!this.video) return null;
    this.facingMode = this.facingMode === 'user' ? 'environment' : 'user';
    return this.start(this.video);
  }

  public getStream(): MediaStream | null {
    return this.stream;
  }

  public getFacingMode(): 'user' | 'environment' {
    return this.facingMode;
  }

  public getIsMirrored(): boolean {
    return this.isMirrored;
  }

  public isActive(): boolean {
    return !!this.stream && this.stream.active;
  }
}

