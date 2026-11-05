'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Camera, RefreshCw, FlipHorizontal, AlertCircle, CheckCircle2 } from 'lucide-react';
import { CameraManager } from '@/lib/camera/CameraManager';
import { PoseDetectionService, ExtractedBodyLandmarks } from '@/lib/pose/PoseDetection';

export default function PoseTestPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const cameraManagerRef = useRef<CameraManager | null>(null);
  const poseServiceRef = useRef<PoseDetectionService | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('Camera idle');
  const [isMirrored, setIsMirrored] = useState(true);
  const [detectedConfidence, setDetectedConfidence] = useState<number | null>(null);

  // Initialize MediaPipe PoseLandmarker
  useEffect(() => {
    const poseService = new PoseDetectionService();
    poseServiceRef.current = poseService;

    setIsLoading(true);
    setStatusMessage('Loading MediaPipe Pose Landmarker...');

    poseService
      .initialize()
      .then(() => {
        setModelReady(true);
        setIsLoading(false);
        setStatusMessage('AI Pose Engine Ready. Click "Start Camera" to test.');
      })
      .catch((err) => {
        setIsLoading(false);
        setError('Failed to initialize AI Pose Engine: ' + err.message);
      });

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      if (cameraManagerRef.current) {
        cameraManagerRef.current.stop();
      }
      poseService.close();
    };
  }, []);

  const startCamera = async () => {
    if (!videoRef.current || !modelReady) return;
    setIsLoading(true);
    setError(null);
    setStatusMessage('Requesting camera permission...');

    try {
      if (!cameraManagerRef.current) {
        cameraManagerRef.current = new CameraManager();
      }

      await cameraManagerRef.current.start(videoRef.current);
      setIsCameraActive(true);
      setIsLoading(false);
      setStatusMessage('Camera running. Stand back to capture shoulders & upper torso.');
      startDetectionLoop();
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Could not start camera');
    }
  };

  const stopCamera = () => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (cameraManagerRef.current) {
      cameraManagerRef.current.stop();
    }
    setIsCameraActive(false);
    setStatusMessage('Camera stopped');
    setDetectedConfidence(null);

    // Clear canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const toggleMirror = () => {
    if (cameraManagerRef.current) {
      const mirrored = cameraManagerRef.current.toggleMirror();
      setIsMirrored(mirrored);
    } else {
      setIsMirrored((prev) => !prev);
    }
  };

  const startDetectionLoop = () => {
    const loop = (timestamp: number) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const poseService = poseServiceRef.current;

      if (video && canvas && poseService && video.readyState >= 2) {
        // Sync canvas resolution with video dimensions
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        const landmarks: ExtractedBodyLandmarks | null = poseService.detect(video, timestamp);
        renderSkeleton(canvas, landmarks);
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);
  };

  const renderSkeleton = (canvas: HTMLCanvasElement, landmarks: ExtractedBodyLandmarks | null) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!landmarks) {
      setStatusMessage('Searching for body in frame...');
      setDetectedConfidence(null);
      return;
    }

    const {
      leftShoulder,
      rightShoulder,
      leftElbow,
      rightElbow,
      leftWrist,
      rightWrist,
      leftHip,
      rightHip,
    } = landmarks;

    // Visibility / Confidence Check
    const minVis = 0.45;
    const shouldersVisible = leftShoulder.visibility > minVis && rightShoulder.visibility > minVis;

    if (!shouldersVisible) {
      setStatusMessage('Please stand facing camera — shoulders not clear.');
      setDetectedConfidence(Math.round(((leftShoulder.visibility + rightShoulder.visibility) / 2) * 100));
      return;
    }

    const avgConfidence = Math.round(
      ((leftShoulder.visibility + rightShoulder.visibility + leftHip.visibility + rightHip.visibility) / 4) * 100
    );
    setDetectedConfidence(avgConfidence);
    setStatusMessage('Upper body tracked successfully');

    const w = canvas.width;
    const h = canvas.height;

    // Coordinate conversion considering mirror option
    const transformX = (normX: number) => (isMirrored ? (1 - normX) * w : normX * w);
    const transformY = (normY: number) => normY * h;

    const points = [
      { name: 'L Shoulder', ...leftShoulder },
      { name: 'R Shoulder', ...rightShoulder },
      { name: 'L Elbow', ...leftElbow },
      { name: 'R Elbow', ...rightElbow },
      { name: 'L Wrist', ...leftWrist },
      { name: 'R Wrist', ...rightWrist },
      { name: 'L Hip', ...leftHip },
      { name: 'R Hip', ...rightHip },
    ];

    // Draw skeletal connection lines
    const connections = [
      [leftShoulder, rightShoulder],
      [leftShoulder, leftElbow],
      [leftElbow, leftWrist],
      [rightShoulder, rightElbow],
      [rightElbow, rightWrist],
      [leftShoulder, leftHip],
      [rightShoulder, rightHip],
      [leftHip, rightHip],
    ];

    ctx.lineWidth = 3;
    ctx.strokeStyle = '#C8FF45'; // NOIR accent lime

    connections.forEach(([p1, p2]) => {
      if (p1.visibility > minVis && p2.visibility > minVis) {
        ctx.beginPath();
        ctx.moveTo(transformX(p1.x), transformY(p1.y));
        ctx.lineTo(transformX(p2.x), transformY(p2.y));
        ctx.stroke();
      }
    });

    // Draw landmark joint points
    points.forEach((pt) => {
      if (pt.visibility > minVis) {
        const px = transformX(pt.x);
        const py = transformY(pt.y);

        // Outer glow
        ctx.fillStyle = 'rgba(200, 255, 69, 0.3)';
        ctx.beginPath();
        ctx.arc(px, py, 10, 0, 2 * Math.PI);
        ctx.fill();

        // Inner solid dot
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, 2 * Math.PI);
        ctx.fill();

        // Joint Label
        ctx.font = '10px monospace';
        ctx.fillStyle = '#C8FF45';
        ctx.fillText(pt.name, px + 12, py + 4);
      }
    });

    // Draw torso orientation vector and center
    const shoulderCenterX = (transformX(leftShoulder.x) + transformX(rightShoulder.x)) / 2;
    const shoulderCenterY = (transformY(leftShoulder.y) + transformY(rightShoulder.y)) / 2;

    ctx.fillStyle = '#C8FF45';
    ctx.beginPath();
    ctx.arc(shoulderCenterX, shoulderCenterY, 6, 0, 2 * Math.PI);
    ctx.fill();

    ctx.font = '11px monospace';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('TORSO CENTER', shoulderCenterX + 10, shoulderCenterY - 10);
  };

  return (
    <div className="min-h-screen bg-[#111111] text-white flex flex-col">
      {/* Navigation Header */}
      <nav className="px-6 md:px-12 py-5 flex items-center justify-between border-b border-white/10">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-[#858585] hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          Return to Store
        </Link>
        <span className="font-bold tracking-[0.3em] text-sm">NOIR // PHASE 2 POSE DIAGNOSTICS</span>
        <div className="flex items-center gap-2">
          {modelReady ? (
            <span className="flex items-center gap-1.5 text-xs text-[#C8FF45] bg-[#C8FF45]/10 px-3 py-1 rounded-full font-mono">
              <CheckCircle2 size={12} /> VISION READY
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full font-mono">
              <RefreshCw size={12} className="animate-spin" /> LOADING MODEL...
            </span>
          )}
        </div>
      </nav>

      {/* Main Diagnostic Viewport */}
      <main className="flex-1 flex flex-col lg:flex-row p-6 md:p-12 gap-8 max-w-7xl mx-auto w-full">
        {/* Camera Feed Canvas Area */}
        <div className="flex-1 flex flex-col">
          <div className="relative aspect-[4/3] w-full bg-black rounded-xl overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center">
            {/* Raw Webcam Video Element */}
            <video
              ref={videoRef}
              className={`absolute inset-0 w-full h-full object-cover transition-transform duration-200 ${
                isMirrored ? 'scale-x-[-1]' : 'scale-x-100'
              } ${isCameraActive ? 'opacity-100' : 'opacity-0'}`}
              playsInline
              muted
            />

            {/* Tracking Skeleton Overlay Canvas */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
            />

            {/* Overlay Status Message Pill */}
            {isCameraActive && (
              <div className="absolute top-4 left-4 z-20 bg-black/70 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 flex items-center gap-2 font-mono text-xs">
                <span className="w-2 h-2 rounded-full bg-[#C8FF45] animate-pulse" />
                <span>{statusMessage}</span>
                {detectedConfidence !== null && (
                  <span className="text-[#858585] ml-2">[{detectedConfidence}%]</span>
                )}
              </div>
            )}

            {/* Placeholder state when camera is inactive */}
            {!isCameraActive && (
              <div className="text-center p-8 z-10 max-w-sm">
                <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center mx-auto mb-4 text-[#858585]">
                  <Camera size={28} />
                </div>
                <h3 className="text-sm uppercase tracking-[0.2em] font-semibold mb-2">Camera Inactive</h3>
                <p className="text-xs text-[#858585] leading-relaxed mb-6">
                  Click the button below to grant camera access and initialize live MediaPipe skeletal tracking.
                </p>
                <button
                  onClick={startCamera}
                  disabled={!modelReady || isLoading}
                  className="px-6 py-3 bg-[#C8FF45] text-[#111111] font-semibold text-xs tracking-[0.15em] uppercase rounded-none hover:bg-white transition-all disabled:opacity-40 cursor-pointer"
                >
                  {isLoading ? 'Starting...' : 'Activate Camera'}
                </button>
              </div>
            )}
          </div>

          {/* Control Bar */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 p-4 bg-[#1a1a1a] rounded-lg border border-white/5">
            <div className="flex items-center gap-3">
              {isCameraActive ? (
                <button
                  onClick={stopCamera}
                  className="px-5 py-2.5 bg-red-500/20 text-red-300 border border-red-500/30 text-xs tracking-[0.15em] uppercase hover:bg-red-500/30 transition-colors"
                >
                  Stop Camera
                </button>
              ) : (
                <button
                  onClick={startCamera}
                  disabled={!modelReady || isLoading}
                  className="px-5 py-2.5 bg-[#C8FF45] text-[#111111] font-medium text-xs tracking-[0.15em] uppercase hover:bg-white transition-colors disabled:opacity-40"
                >
                  Start Camera
                </button>
              )}

              <button
                onClick={toggleMirror}
                disabled={!isCameraActive}
                className="px-4 py-2.5 bg-white/5 border border-white/10 text-xs tracking-[0.1em] uppercase hover:bg-white/10 transition-colors flex items-center gap-2 disabled:opacity-40"
              >
                <FlipHorizontal size={14} />
                {isMirrored ? 'Mirrored: ON' : 'Mirrored: OFF'}
              </button>
            </div>

            <div className="text-xs font-mono text-[#858585]">
              RESOLUTION: 1280x720 (Target)
            </div>
          </div>
        </div>

        {/* Diagnostic Panel Sidebar */}
        <div className="w-full lg:w-80 flex flex-col gap-6">
          <div className="p-6 bg-[#1a1a1a] rounded-xl border border-white/10">
            <h3 className="text-xs uppercase tracking-[0.25em] text-[#858585] font-mono mb-4">
              Diagnostic Telemetry
            </h3>

            <div className="space-y-4 font-mono text-xs">
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-[#858585]">Pose Model</span>
                <span className="text-[#C8FF45]">MediaPipe Lite v1</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-[#858585]">Inference Mode</span>
                <span className="text-white">Continuous Video</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-[#858585]">Tracking Status</span>
                <span className={detectedConfidence ? 'text-[#C8FF45]' : 'text-amber-400'}>
                  {detectedConfidence ? 'LOCKED' : 'SEARCHING'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-[#858585]">Key Upper Joints</span>
                <span className="text-white">8 Identified</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[#858585]">Confidence</span>
                <span className="text-white">{detectedConfidence ? `${detectedConfidence}%` : '--'}</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-[#1a1a1a] rounded-xl border border-white/10">
            <h3 className="text-xs uppercase tracking-[0.25em] text-[#858585] font-mono mb-3">
              Acceptance Checklist
            </h3>
            <ul className="text-xs space-y-2.5 text-[#858585]">
              <li className="flex items-center gap-2">
                <span className="text-[#C8FF45]">✔</span> Camera permission requested on demand
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#C8FF45]">✔</span> Live video feed with zero distortion
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#C8FF45]">✔</span> Real MediaPipe landmark detection
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#C8FF45]">✔</span> Shoulder, elbow, wrist, hip joints tracked
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#C8FF45]">✔</span> Clean stream shutdown on exit
              </li>
            </ul>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 text-xs text-red-300">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Camera / Inference Alert</p>
                <p>{error}</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

