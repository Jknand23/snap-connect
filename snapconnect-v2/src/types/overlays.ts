/**
 * Overlay Types
 * TypeScript interfaces for the sports overlay system
 */

export interface TeamColors {
  primary: string;
  secondary: string;
  accent: string;
}

export interface TeamAsset {
  id: string;
  teamId: string;
  league: 'NFL' | 'NBA' | 'MLB' | 'NHL';
  name: string;
  abbreviation: string;
  city: string;
  colors: TeamColors;
  logoUrl?: string;
}

export interface OverlayPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scale: number;
}

export interface OverlayTemplate {
  id: string;
  name: string;
  category: 'victory' | 'gameday' | 'pride' | 'rivalry' | 'seasonal' | 'player';
  description: string;
  preview: string; // emoji or icon
  defaultPosition: OverlayPosition;
  teamDependent: boolean;
  elements: OverlayElement[];
}

export interface OverlayElement {
  id: string;
  type: 'text' | 'logo' | 'gradient' | 'frame' | 'badge';
  content: string;
  position: OverlayPosition;
  style: OverlayStyle;
  animations?: OverlayAnimation[];
}

export interface OverlayStyle {
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold' | 'heavy';
  color?: string;
  backgroundColor?: string;
  gradient?: string[];
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  shadowColor?: string;
  shadowOffset?: { x: number; y: number };
  shadowRadius?: number;
  opacity?: number;
  textAlign?: 'left' | 'center' | 'right';
  textShadow?: boolean;
  blur?: number;
}

export interface OverlayAnimation {
  type: 'pulse' | 'bounce' | 'rotate' | 'scale' | 'fade' | 'slide';
  duration: number;
  delay?: number;
  repeat?: boolean;
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
}

export interface ActiveOverlay {
  id: string;
  templateId: string;
  teamId?: string;
  position: OverlayPosition;
  customContent?: string;
  style?: Partial<OverlayStyle>;
  isSelected: boolean;
  isVisible: boolean;
  zIndex: number;
}

export interface OverlayGesture {
  type: 'pan' | 'pinch' | 'rotate';
  overlayId: string;
  startPosition: OverlayPosition;
  currentPosition: OverlayPosition;
  velocity?: { x: number; y: number };
}

export interface OverlayCaptureOptions {
  format: 'jpg' | 'png';
  quality: number;
  width?: number;
  height?: number;
  includeOverlays: boolean;
  overlayIds?: string[];
}

export interface SmartSuggestion {
  template: OverlayTemplate;
  relevance: number;
  reason: 'favorite-team' | 'game-today' | 'recent-victory' | 'rivalry' | 'seasonal' | 'fallback' | 'emergency-fallback';
  teamId?: string;
}

export interface OverlayPreset {
  id: string;
  name: string;
  description: string;
  overlays: ActiveOverlay[];
  teamSpecific: boolean;
  category: string;
} 