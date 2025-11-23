export enum AppStatus {
  IDLE = 'IDLE',
  GENERATING_BLUEPRINT = 'GENERATING_BLUEPRINT',
  RASTERIZING = 'RASTERIZING',
  GENERATING_PERSPECTIVES = 'GENERATING_PERSPECTIVES',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR',
  STOPPED = 'STOPPED'
}

export type GenerationMode = 'blueprint-only' | 'fast' | 'quality';

export interface Perspective {
  id: string;
  type: string;
  imageUrl: string;
  description: string;
}

export interface GenerationState {
  prompt: string;
  svgCode: string | null;
  blueprintImageBase64: string | null;
  perspectives: Perspective[];
  status: AppStatus;
  errorMessage: string | null;
  mode: GenerationMode;
  blueprintTime?: number;
  renderTime?: number;
}

export type PerspectiveType = 'Isometric' | 'Eye-Level' | 'Top-Down' | 'Elevation';