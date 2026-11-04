// ─── Product & Collection Types ─────────────────────────────────────────────

export interface ProductColor {
  name: string;
  hex: string;
  image: string; // path to product image for this color
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  price: number;
  description: string;
  category: string;
  fit: 'oversized' | 'regular' | 'slim';
  colors: ProductColor[];
  sizes: string[];
  garmentAsset: string; // path to transparent garment PNG for try-on
  featured?: boolean;
}

// ─── Virtual Try-On Types ───────────────────────────────────────────────────

export interface BodyLandmarks {
  leftShoulder: LandmarkPoint;
  rightShoulder: LandmarkPoint;
  leftElbow: LandmarkPoint;
  rightElbow: LandmarkPoint;
  leftWrist: LandmarkPoint;
  rightWrist: LandmarkPoint;
  leftHip: LandmarkPoint;
  rightHip: LandmarkPoint;
}

export interface LandmarkPoint {
  x: number; // normalized 0-1
  y: number; // normalized 0-1
  z: number;
  visibility: number; // confidence 0-1
}

export interface GarmentFitParams {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  rotation: number; // radians
  shoulderWidth: number;
  torsoHeight: number;
  scale: number;
}

export interface FittingConfig {
  fit: 'oversized' | 'regular' | 'slim';
  widthMultiplier: number;
  heightMultiplier: number;
  yOffset: number; // vertical offset from shoulder center
}

export interface CameraState {
  isActive: boolean;
  isLoading: boolean;
  isMirrored: boolean;
  hasPermission: boolean | null;
  error: string | null;
  facingMode: 'user' | 'environment';
}

export interface TrackingState {
  isDetected: boolean;
  confidence: number;
  message: string;
}

