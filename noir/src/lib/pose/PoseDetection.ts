import { FilesetResolver, PoseLandmarker, PoseLandmarkerResult } from '@mediapipe/tasks-vision';

export interface ExtractedBodyLandmarks {
  leftShoulder: { x: number; y: number; z: number; visibility: number };
  rightShoulder: { x: number; y: number; z: number; visibility: number };
  leftElbow: { x: number; y: number; z: number; visibility: number };
  rightElbow: { x: number; y: number; z: number; visibility: number };
  leftWrist: { x: number; y: number; z: number; visibility: number };
  rightWrist: { x: number; y: number; z: number; visibility: number };
  leftHip: { x: number; y: number; z: number; visibility: number };
  rightHip: { x: number; y: number; z: number; visibility: number };
  neck: { x: number; y: number; z: number; visibility: number };
  nose: { x: number; y: number; z: number; visibility: number };
  rawLandmarks: Array<{ x: number; y: number; z: number; visibility?: number }>;
  segmentationMask?: any; // MPImage or CanvasImageSource when segmentation is enabled
}

export class PoseDetectionService {
  private poseLandmarker: PoseLandmarker | null = null;
  private isInitializing: boolean = false;
  private hasSegmentation: boolean = false;

  public async initialize(): Promise<void> {
    if (this.poseLandmarker || this.isInitializing) return;
    this.isInitializing = true;

    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      // Attempt to load model with segmentation enabled for arm/torso occlusion
      try {
        this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
          outputSegmentationMasks: true,
        });
        this.hasSegmentation = true;
      } catch (segErr) {
        console.warn('Segmentation with GPU failed, loading standard pose model:', segErr);
        this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
          outputSegmentationMasks: false,
        });
        this.hasSegmentation = false;
      }
    } finally {
      this.isInitializing = false;
    }
  }

  public detect(videoElement: HTMLVideoElement, timestamp: number): ExtractedBodyLandmarks | null {
    if (!this.poseLandmarker || videoElement.readyState < 2) return null;

    const result: PoseLandmarkerResult = this.poseLandmarker.detectForVideo(videoElement, timestamp);

    if (!result.landmarks || result.landmarks.length === 0) {
      return null;
    }

    const marks = result.landmarks[0];
    if (!marks || marks.length < 25) return null;

    const getMark = (idx: number) => ({
      x: marks[idx].x,
      y: marks[idx].y,
      z: marks[idx].z || 0,
      visibility: marks[idx].visibility !== undefined ? marks[idx].visibility : 1,
    });

    const nose = getMark(0);
    const leftShoulder = getMark(11);
    const rightShoulder = getMark(12);
    const leftElbow = getMark(13);
    const rightElbow = getMark(14);
    const leftWrist = getMark(15);
    const rightWrist = getMark(16);
    const leftHip = getMark(23);
    const rightHip = getMark(24);

    // Approximate neck position: midpoint between shoulders, slightly elevated towards nose
    const neck = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2 - 0.02,
      z: (leftShoulder.z + rightShoulder.z) / 2,
      visibility: Math.min(leftShoulder.visibility, rightShoulder.visibility),
    };

    let segmentationMask: any = undefined;
    if (result.segmentationMasks && result.segmentationMasks.length > 0) {
      segmentationMask = result.segmentationMasks[0];
    }

    return {
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
      rawLandmarks: marks,
      segmentationMask,
    };
  }

  public close(): void {
    if (this.poseLandmarker) {
      this.poseLandmarker.close();
      this.poseLandmarker = null;
    }
  }
}
