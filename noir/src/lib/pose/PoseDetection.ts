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
}

export class PoseDetectionService {
  private poseLandmarker: PoseLandmarker | null = null;
  private isInitializing: boolean = false;

  public async initialize(): Promise<void> {
    if (this.poseLandmarker || this.isInitializing) return;
    this.isInitializing = true;

    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      // Always initialize with standard robust settings for max browser compatibility
      try {
        this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.45,
          minPosePresenceConfidence: 0.45,
          minTrackingConfidence: 0.45,
          outputSegmentationMasks: false,
        });
      } catch (gpuErr) {
        console.warn('GPU delegate failed, fallback to CPU delegate:', gpuErr);
        this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.45,
          minPosePresenceConfidence: 0.45,
          minTrackingConfidence: 0.45,
          outputSegmentationMasks: false,
        });
      }
    } finally {
      this.isInitializing = false;
    }
  }

  public detect(videoElement: HTMLVideoElement, timestamp: number): ExtractedBodyLandmarks | null {
    if (!this.poseLandmarker || videoElement.readyState < 2) return null;

    try {
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

      const neck = {
        x: (leftShoulder.x + rightShoulder.x) / 2,
        y: (leftShoulder.y + rightShoulder.y) / 2 - 0.02,
        z: (leftShoulder.z + rightShoulder.z) / 2,
        visibility: Math.min(leftShoulder.visibility, rightShoulder.visibility),
      };

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
      };
    } catch (e) {
      console.warn('Frame detection skipped:', e);
      return null;
    }
  }

  public close(): void {
    if (this.poseLandmarker) {
      this.poseLandmarker.close();
      this.poseLandmarker = null;
    }
  }
}
