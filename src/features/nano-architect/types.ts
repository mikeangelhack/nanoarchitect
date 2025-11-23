import React from 'react';

export interface BlueprintItem {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
}

export enum ComponentType {
  WALL_HORIZONTAL = 'WALL_HORIZONTAL',
  WALL_VERTICAL = 'WALL_VERTICAL',
  ROOM_SQUARE = 'ROOM_SQUARE',
  ROOM_L_SHAPE = 'ROOM_L_SHAPE',
  DOOR = 'DOOR',
  WINDOW = 'WINDOW',
  DESK = 'DESK',
  BED = 'BED',
  PLANT = 'PLANT',
  CHAIR = 'CHAIR'
}

export interface CatalogItem {
  type: ComponentType;
  label: string;
  icon: React.ReactNode; // Icon component or SVG
  defaultWidth: number;
  defaultHeight: number;
  category: 'structure' | 'furniture' | 'deco';
}

export type ViewMode = 'editor' | 'architect';

export interface ImageEditState {
  originalImage: string | null;
  processedImage: string | null;
  prompt: string;
  loading: boolean;
  error: string | null;
}

export interface ArchitectState {
  items: BlueprintItem[];
  selectedId: string | null;
  prompt: string;
  isGenerating: boolean;
  renderedPerspective: string | null;
}