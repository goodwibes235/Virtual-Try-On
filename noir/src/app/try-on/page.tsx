'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Camera,
  FlipHorizontal,
  Download,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Layers,
} from 'lucide-react';
import { products } from '@/data/products';
import { Product } from '@/types';
import { CameraManager } from '@/lib/camera/CameraManager';
import { PoseDetectionService, ExtractedBodyLandmarks } from '@/lib/pose/PoseDetection';
import {
  TriangulatedGarmentMeshEngine,
  PhotorealFitParameters,
} from '@/lib/garment/TriangulatedGarmentMeshEngine';
import { VertexSmoother } from '@/lib/garment/VertexSmoother';
import { MeshVertex } from '@/lib/garment/AffineWarp';

function VirtualFittingRoomContent() {
  const searchParams = useSearchParams();
  const initialProductId = searchParams.get('product') || 'belgian-training-tee';

  const [selectedProduct, setSelectedProduct] = useState<Product>(() => {
    return products.find((p) => p.id === initialProductId) || products[0];
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const cameraManagerRef = useRef<CameraManager | null>(null);
  const poseServiceRef = useRef<PoseDetectionService | null>(null);
  const meshEngineRef = useRef<TriangulatedGarmentMeshEngine | null>(null);
  const vertexSmootherRef = useRef<VertexSmoother | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('Neural fitting studio initialized');
  const [isMirrored, setIsMirrored] = useState(true);
  const [trackingConfidence, setTrackingConfidence] = useState<number | null>(null);
  const [capturedScreenshot, setCapturedScreenshot] = useState<string | null>(null);

  const getProductFitConfig = (product: Product): PhotorealFitParameters => {
    switch (product.id) {
      case 'belgian-training-tee':
        return {
          shoulderSpanMultiplier: 1.26,
          sleeveLengthRatio: 0.58,
          torsoLengthMultiplier: 1.32,
          waistFlare: 1.04,
          collarDipOffset: 0.11,
          depthExtrusion: 1.15,
        };
      case 'graphic-streetwear-tee':
        return {
          shoulderSpanMultiplier: 1.35, // Dropped shoulders
          sleeveLengthRatio: 0.68, // Oversized half-sleeves
          torsoLengthMultiplier: 1.38,
          waistFlare: 1.1,
          collarDipOffset: 0.13,
          depthExtrusion: 1.25,
        };
      case 'blue-geometric-tee':
        return {
          shoulderSpanMultiplier: 1.2,
          sleeveLengthRatio: 0.52,
          torsoLengthMultiplier: 1.26,
          waistFlare: 1.0,
          collarDipOffset: 0.1,
          depthExtrusion: 1.1,
        };
      case 'golf-polo-3d':
        return {
          shoulderSpanMultiplier: 1.12,
          sleeveLengthRatio: 0.46,
          torsoLengthMultiplier: 1.22,
          waistFlare: 0.96,
          collarDipOffset: 0.08, // Higher collar
          depthExtrusion: 1.05,
        };
      default:
        return {
          shoulderSpanMultiplier: 1.22,
          sleeveLengthRatio: 0.55,
          torsoLengthMultiplier: 1.28,
          waistFlare: 1.02,
          collarDipOffset: 0.11,
          depthExtrusion: 1.1,
        };
    }
  };

  // Initialize Pose Tracker & Triangulated Affine Mesh Warper
  useEffect(() => {
    const poseService = new PoseDetectionService();
    poseServiceRef.current = poseService;

    const meshEngine = new TriangulatedGarmentMeshEngine();
    meshEngineRef.current = meshEngine;

    vertexSmootherRef.current = new VertexSmoother(0.34);

    setIsLoading(true);
    setStatusMessage('Loading Pose Engine & Garment Texture...');

    Promise.all([
      poseService.initialize(),
      meshEngine.loadGarment(selectedProduct.garmentAsset),
    ])
      .then(() => {
        setModelReady(true);
        setIsLoading(false);
        setStatusMessage('System Ready. Stand in front of camera to begin.');
      })
      .catch((err) => {
        setIsLoading(false);
        setError('Failed to initialize fitting engine: ' + err.message);
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

  // Hot-swap garment texture when switching shirts
  useEffect(() => {
    if (meshEngineRef.current && selectedProduct) {
      meshEngineRef.current.loadGarment(selectedProduct.garmentAsset).catch(console.error);
      vertexSmootherRef.current?.reset();
    }
  }, [selectedProduct]);

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
      setStatusMessage('Camera live. Stand facing camera to calculate anatomical fit.');
      startFittingLoop();
    } catch (err: any) {
      setIsLoading(false);
      setError(err.message || 'Could not start camera feed');
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
    vertexSmootherRef.current?.reset();
    setIsCameraActive(false);
    setStatusMessage('Virtual fitting paused');
    setTrackingConfidence(null);

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

  const capturePhoto = () => {
    const video = videoRef.current;
    const overlayCanvas = canvasRef.current;
    if (!video || !overlayCanvas || !isCameraActive) return;

    const compositeCanvas = document.createElement('canvas');
    compositeCanvas.width = video.videoWidth;
    compositeCanvas.height = video.videoHeight;
    const ctx = compositeCanvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    if (isMirrored) {
      ctx.translate(compositeCanvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, compositeCanvas.width, compositeCanvas.height);
    ctx.restore();

    ctx.drawImage(overlayCanvas, 0, 0);

    const dataUrl = compositeCanvas.toDataURL('image/png');
    setCapturedScreenshot(dataUrl);
  };

  const startFittingLoop = () => {
    const loop = (timestamp: number) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const poseService = poseServiceRef.current;
      const meshEngine = meshEngineRef.current;
      const smoother = vertexSmootherRef.current;

      if (video && canvas && poseService && meshEngine && smoother && video.readyState >= 2) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // 1. Detect body pose landmarks
          const landmarks: ExtractedBodyLandmarks | null = poseService.detect(video, timestamp);

          if (!landmarks) {
            setStatusMessage('Stand in front of the camera');
            setTrackingConfidence(null);
            smoother.smooth(null);
          } else {
            // 2. Compute 14 triangulated mesh vertices based on user's actual body coordinates
            const fitParams = getProductFitConfig(selectedProduct);
            const rawVertices = meshEngine.computeDeformedVertices(
              landmarks,
              canvas.width,
              canvas.height,
              isMirrored,
              fitParams
            );

            // 3. Smooth vertex positions to eliminate jitter
            const smoothedVertices: MeshVertex[] | null = smoother.smooth(rawVertices);

            if (smoothedVertices) {
              const conf = Math.round(
                ((landmarks.leftShoulder.visibility + landmarks.rightShoulder.visibility) / 2) * 100
              );
              setTrackingConfidence(conf);
              setStatusMessage('Garment fitted with 3D affine triangulation.');

              // 4. Render triangulated fabric mesh with volumetric shading & soft arm occlusion
              meshEngine.renderMesh(
                ctx,
                smoothedVertices,
                canvas.width,
                canvas.height,
                video,
                isMirrored
              );

              // 5. Soft Forearm Layering (Arms across chest)
              renderForearmOcclusion(ctx, landmarks, canvas.width, canvas.height, video, isMirrored);
            } else {
              setStatusMessage('Position shoulders clearly in frame.');
              setTrackingConfidence(null);
            }
          }
        }
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);
  };

  const renderForearmOcclusion = (
    ctx: CanvasRenderingContext2D,
    landmarks: ExtractedBodyLandmarks,
    w: number,
    h: number,
    video: HTMLVideoElement,
    mirrored: boolean
  ) => {
    const tx = (val: number) => (mirrored ? (1 - val) * w : val * w);
    const ty = (val: number) => val * h;

    const arms = [
      {
        start: { x: tx(landmarks.leftElbow.x), y: ty(landmarks.leftElbow.y) },
        end: { x: tx(landmarks.leftWrist.x), y: ty(landmarks.leftWrist.y) },
        vis: landmarks.leftElbow.visibility > 0.45 && landmarks.leftWrist.visibility > 0.45,
      },
      {
        start: { x: tx(landmarks.rightElbow.x), y: ty(landmarks.rightElbow.y) },
        end: { x: tx(landmarks.rightWrist.x), y: ty(landmarks.rightWrist.y) },
        vis: landmarks.rightElbow.visibility > 0.45 && landmarks.rightWrist.visibility > 0.45,
      },
    ];

    for (const arm of arms) {
      if (!arm.vis) continue;

      const dx = arm.end.x - arm.start.x;
      const dy = arm.end.y - arm.start.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 20) continue;

      const armWidth = Math.min(42, dist * 0.32);
      const angle = Math.atan2(dy, dx);
      const nx = -Math.sin(angle) * armWidth * 0.5;
      const ny = Math.cos(angle) * armWidth * 0.5;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(arm.start.x + nx, arm.start.y + ny);
      ctx.lineTo(arm.end.x + nx, arm.end.y + ny);
      ctx.arc(arm.end.x, arm.end.y, armWidth * 0.5, angle - Math.PI / 2, angle + Math.PI / 2);
      ctx.lineTo(arm.start.x - nx, arm.start.y - ny);
      ctx.arc(arm.start.x, arm.start.y, armWidth * 0.5, angle + Math.PI / 2, angle - Math.PI / 2);
      ctx.closePath();
      ctx.clip();

      ctx.save();
      if (mirrored) {
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, w, h);
      ctx.restore();

      ctx.restore();
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col font-sans select-none">
      {/* Top Header */}
      <nav className="px-6 md:px-12 py-5 flex items-center justify-between border-b border-white/10 bg-[#111111]/80 backdrop-blur-md">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-[#858585] hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          Exit Studio
        </Link>
        <div className="flex items-center gap-3">
          <span className="font-bold tracking-[0.3em] text-sm text-[#F5F3EF]">
            NOIR // LIVE VIRTUAL FITTING ROOM
          </span>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] bg-[#C8FF45]/15 text-[#C8FF45] px-3 py-1 rounded-full font-mono border border-[#C8FF45]/30">
            <Layers size={11} /> 14-POINT AFFINE WARP MESH
          </span>
        </div>
        <div className="flex items-center gap-2">
          {modelReady ? (
            <span className="flex items-center gap-1.5 text-xs text-[#C8FF45] bg-[#C8FF45]/10 px-3 py-1 rounded-full font-mono">
              <CheckCircle2 size={12} /> ENGINE READY
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full font-mono">
              <RefreshCw size={12} className="animate-spin" /> LOADING MODEL...
            </span>
          )}
        </div>
      </nav>

      {/* Main Studio Viewport */}
      <main className="flex-1 flex flex-col lg:flex-row p-6 md:p-10 gap-8 max-w-7xl mx-auto w-full">
        {/* Live Fitting Screen */}
        <div className="flex-1 flex flex-col">
          <div className="relative aspect-[3/4] md:aspect-[4/3] w-full bg-black rounded-2xl overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex items-center justify-center">
            {/* Live Camera Feed */}
            <video
              ref={videoRef}
              className={`absolute inset-0 w-full h-full object-cover transition-transform duration-200 ${isMirrored ? 'scale-x-[-1]' : 'scale-x-100'
                } ${isCameraActive ? 'opacity-100' : 'opacity-0'}`}
              playsInline
              muted
            />

            {/* Triangulated Garment Canvas Overlay */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
            />

            {/* In-View Status HUD */}
            {isCameraActive && (
              <div className="absolute top-5 left-5 z-20 bg-black/75 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/15 flex items-center gap-2.5 font-mono text-xs">
                <span className="w-2 h-2 rounded-full bg-[#C8FF45] animate-pulse" />
                <span>{statusMessage}</span>
                {trackingConfidence !== null && (
                  <span className="text-[#858585] ml-1">[{trackingConfidence}%]</span>
                )}
              </div>
            )}

            {/* Inactive State Start Screen */}
            {!isCameraActive && (
              <div className="text-center p-8 z-10 max-w-md">
                <div className="w-20 h-20 rounded-full border border-white/20 flex items-center justify-center mx-auto mb-6 text-[#C8FF45] bg-white/5">
                  <Camera size={32} />
                </div>
                <h2 className="text-xl font-bold tracking-[0.1em] uppercase mb-2 text-[#F5F3EF]">
                  Experience Anatomical Virtual Try-On
                </h2>
                <p className="text-xs text-[#858585] leading-relaxed mb-8 max-w-xs mx-auto">
                  Click below to activate your webcam. The 14-point triangular affine warp engine dynamically fits the {selectedProduct.name} to your chest, shoulders, and posture in real time.
                </p>
                <button
                  onClick={startCamera}
                  disabled={!modelReady || isLoading}
                  className="px-8 py-4 bg-[#C8FF45] text-[#111111] font-semibold text-xs tracking-[0.2em] uppercase hover:bg-white transition-all duration-300 disabled:opacity-40 cursor-pointer shadow-lg hover:scale-105"
                >
                  {isLoading ? 'Calibrating...' : 'Start Virtual Fitting'}
                </button>
              </div>
            )}
          </div>

          {/* Action Toolbar */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4 p-4 bg-[#161616] rounded-xl border border-white/5">
            <div className="flex items-center gap-3">
              {isCameraActive ? (
                <button
                  onClick={stopCamera}
                  className="px-5 py-2.5 bg-red-500/20 text-red-300 border border-red-500/30 text-xs tracking-[0.15em] uppercase hover:bg-red-500/30 transition-colors font-medium cursor-pointer"
                >
                  Pause Camera
                </button>
              ) : (
                <button
                  onClick={startCamera}
                  disabled={!modelReady || isLoading}
                  className="px-5 py-2.5 bg-[#C8FF45] text-[#111111] font-semibold text-xs tracking-[0.15em] uppercase hover:bg-white transition-colors disabled:opacity-40 cursor-pointer"
                >
                  Resume Camera
                </button>
              )}

              <button
                onClick={toggleMirror}
                disabled={!isCameraActive}
                className="px-4 py-2.5 bg-white/5 border border-white/10 text-xs tracking-[0.1em] uppercase hover:bg-white/10 transition-colors flex items-center gap-2 disabled:opacity-30 cursor-pointer"
              >
                <FlipHorizontal size={14} />
                {isMirrored ? 'Mirror: On' : 'Mirror: Off'}
              </button>

              <button
                onClick={capturePhoto}
                disabled={!isCameraActive}
                className="px-4 py-2.5 bg-white/5 border border-white/10 text-xs tracking-[0.1em] uppercase hover:bg-[#C8FF45] hover:text-[#111111] transition-colors flex items-center gap-2 disabled:opacity-30 cursor-pointer"
              >
                <Download size={14} />
                Capture Look
              </button>
            </div>

            <div className="font-mono text-xs text-[#858585]">
              SILHOUETTE: <span className="text-white">{selectedProduct.fit.toUpperCase()} FIT PROFILE</span>
            </div>
          </div>
        </div>

        {/* Garment Selector & Look Panel */}
        <div className="w-full lg:w-96 flex flex-col gap-6">
          {/* Selected Product Card */}
          <div className="p-6 bg-[#161616] rounded-2xl border border-white/10">
            <span className="text-xs uppercase tracking-[0.25em] text-[#858585] font-mono">
              Active Garment
            </span>
            <h3 className="text-xl font-bold text-white mt-1 mb-1">{selectedProduct.name}</h3>
            <p className="text-xs text-[#858585] mb-4">{selectedProduct.subtitle}</p>
            <p className="text-2xl font-semibold text-[#C8FF45] mb-6">${selectedProduct.price}.00</p>

            {/* Garment Switcher List */}
            <span className="text-xs uppercase tracking-[0.2em] text-[#858585] font-mono mb-3 block">
              Available Collection
            </span>
            <div className="space-y-2.5">
              {products.map((p) => {
                const isCurrent = p.id === selectedProduct.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProduct(p)}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${isCurrent
                        ? 'bg-[#C8FF45]/10 border-[#C8FF45] text-white'
                        : 'bg-white/5 border-white/5 text-[#858585] hover:border-white/20 hover:text-white'
                      }`}
                  >
                    <div>
                      <p className="text-xs font-semibold text-white">{p.name}</p>
                      <p className="text-[10px] text-[#858585]">
                        {p.fit.toUpperCase()} &bull; ${p.price}
                      </p>
                    </div>
                    <ChevronRight size={16} className={isCurrent ? 'text-[#C8FF45]' : 'opacity-40'} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Captured Screenshot Modal / Preview */}
          {capturedScreenshot && (
            <div className="p-6 bg-[#161616] rounded-2xl border border-white/10 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#C8FF45]">
                  Look Captured
                </span>
                <button
                  onClick={() => setCapturedScreenshot(null)}
                  className="text-xs text-[#858585] hover:text-white"
                >
                  Dismiss
                </button>
              </div>
              <img
                src={capturedScreenshot}
                alt="Captured fitting look"
                className="w-full rounded-lg border border-white/10"
              />
              <a
                href={capturedScreenshot}
                download={`noir-${selectedProduct.id}-fit.png`}
                className="w-full py-2.5 bg-[#C8FF45] text-[#111111] text-xs font-semibold text-center tracking-[0.15em] uppercase hover:bg-white transition-colors"
              >
                Download Snapshot
              </a>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 text-xs text-red-300">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Fitting Room Notice</p>
                <p>{error}</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function TryOnPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#111111] flex items-center justify-center">
          <div className="text-white text-xs tracking-[0.25em] font-mono animate-pulse">
            INITIALIZING STUDIO...
          </div>
        </div>
      }
    >
      <VirtualFittingRoomContent />
    </Suspense>
  );
}
