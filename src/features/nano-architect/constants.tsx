import React from 'react';
import { ComponentType, CatalogItem } from './types';
import { Square, Box, DoorOpen, Columns, Flower, Armchair, BedDouble, Minus } from 'lucide-react';

export const CATALOG: CatalogItem[] = [
  { type: ComponentType.ROOM_SQUARE, label: 'Square Room', icon: <Box />, defaultWidth: 200, defaultHeight: 200, category: 'structure' },
  { type: ComponentType.WALL_HORIZONTAL, label: 'Wall (H)', icon: <Minus className="rotate-0" />, defaultWidth: 100, defaultHeight: 10, category: 'structure' },
  { type: ComponentType.WALL_VERTICAL, label: 'Wall (V)', icon: <Minus className="rotate-90" />, defaultWidth: 10, defaultHeight: 100, category: 'structure' },
  { type: ComponentType.DOOR, label: 'Door', icon: <DoorOpen />, defaultWidth: 50, defaultHeight: 50, category: 'structure' },
  { type: ComponentType.WINDOW, label: 'Window', icon: <Columns />, defaultWidth: 60, defaultHeight: 10, category: 'structure' },
  { type: ComponentType.BED, label: 'Bed', icon: <BedDouble />, defaultWidth: 80, defaultHeight: 100, category: 'furniture' },
  { type: ComponentType.DESK, label: 'Desk', icon: <Square />, defaultWidth: 100, defaultHeight: 40, category: 'furniture' },
  { type: ComponentType.CHAIR, label: 'Chair', icon: <Armchair />, defaultWidth: 30, defaultHeight: 30, category: 'furniture' },
  { type: ComponentType.PLANT, label: 'Plant', icon: <Flower />, defaultWidth: 30, defaultHeight: 30, category: 'deco' },
];

// Render functions for the SVG Canvas
export const renderComponentSVG = (type: ComponentType, width: number, height: number, isSelected: boolean) => {
  const stroke = isSelected ? "#a855f7" : "#334155";
  const fill = isSelected ? "#f3e8ff" : "#1e293b";
  const strokeWidth = isSelected ? 3 : 2;

  switch (type) {
    case ComponentType.ROOM_SQUARE:
      return (
        <g>
          <rect width={width} height={height} fill="#0f172a" stroke={stroke} strokeWidth={strokeWidth} />
          <text x={5} y={20} fill="#64748b" fontSize="12" fontFamily="sans-serif">Room</text>
        </g>
      );
    case ComponentType.WALL_HORIZONTAL:
      return <rect width={width} height={height} fill="#94a3b8" stroke="none" />;
    case ComponentType.WALL_VERTICAL:
      return <rect width={width} height={height} fill="#94a3b8" stroke="none" />;
    case ComponentType.DOOR:
      return (
        <g>
           {/* Door Swing */}
           <path d={`M0,${height} Q${width},${height} ${width},0`} fill="none" stroke={stroke} strokeDasharray="4,4" />
           {/* Door Panel */}
           <rect x={width-5} y={0} width={5} height={height} fill="#cbd5e1" />
        </g>
      );
    case ComponentType.WINDOW:
      return (
        <g>
           <rect width={width} height={height} fill="#e2e8f0" stroke="#94a3b8" />
           <line x1={width/2} y1={0} x2={width/2} y2={height} stroke="#94a3b8" />
        </g>
      );
    case ComponentType.BED:
      return (
        <g>
          <rect width={width} height={height} rx="5" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          <rect x={5} y={5} width={width-10} height={20} rx="2" fill="#cbd5e1" /> {/* Pillow */}
          <rect x={5} y={30} width={width-10} height={height-35} rx="2" fill="#e2e8f0" /> {/* Sheet */}
        </g>
      );
    case ComponentType.DESK:
      return (
         <g>
          <rect width={width} height={height} fill="#475569" stroke={stroke} strokeWidth={strokeWidth} />
         </g>
      );
    case ComponentType.CHAIR:
      return (
        <g>
          <circle cx={width/2} cy={height/2} r={width/2} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          <rect x={5} y={height-10} width={width-10} height={5} rx="2" fill="#64748b" /> {/* Backrest */}
        </g>
      );
    case ComponentType.PLANT:
       return (
         <g>
           <circle cx={width/2} cy={height/2} r={width/2} fill="#22c55e" fillOpacity="0.2" stroke="#22c55e" />
           <circle cx={width/2} cy={height/2} r={5} fill="#22c55e" />
         </g>
       );
    case ComponentType.ROOM_L_SHAPE:
        // Basic fallback for L-Shape if generated
        return (
            <path d={`M0,0 L${width},0 L${width},${height/2} L${width/2},${height/2} L${width/2},${height} L0,${height} Z`} 
                  fill="#0f172a" stroke={stroke} strokeWidth={strokeWidth} />
        );
    default:
      return <rect width={width} height={height} fill="red" opacity="0.5" />;
  }
};

export const BLUEPRINT_SYSTEM_INSTRUCTION = `
You are an expert architectural layout engine.
Your task is to generate a JSON blueprint for a floor plan based on a user's description.

**Available Components:**
Structure: ROOM_SQUARE, WALL_HORIZONTAL, WALL_VERTICAL, DOOR, WINDOW
Furniture: BED, DESK, CHAIR, PLANT

**Geometry & Coordinate Rules (CRITICAL):**
1.  **Canvas Size**: 800x600 pixels. Center is (400, 300). Top-left is (0,0).
2.  **Room Placement**:
    *   Start by placing a 'ROOM_SQUARE' centered on the canvas (e.g., x=300, y=200).
    *   Default Room Size is 200x200.
    *   Use 'scaleX' and 'scaleY' to resize the room. (e.g., scaleX=1.5 -> width=300).
3.  **Containment Logic (MANDATORY)**:
    *   All furniture (BED, DESK, CHAIR, PLANT) **MUST** be placed strictly INSIDE the room's rectangle.
    *   *Calculation*:
        *   If Room is at (Rx, Ry) with Size (Rw, Rh):
        *   Furniture at (Fx, Fy) with Size (Fw, Fh) must satisfy:
            *   Fx >= Rx + 10
            *   Fy >= Ry + 10
            *   Fx + Fw <= Rx + Rw - 10
            *   Fy + Fh <= Ry + Rh - 10
    *   **NEVER** place furniture at (0,0) or in negative coordinates.
4.  **Perimeter Logic**:
    *   'DOOR' and 'WINDOW' must be placed on the *edges* of the room rectangle.
    *   Rotate them 0, 90, 180, 270 to align with walls.

**Example Response**:
{
  "items": [
    { "type": "ROOM_SQUARE", "x": 300, "y": 200, "rotation": 0, "scaleX": 1.5, "scaleY": 1.5 },
    { "type": "BED", "x": 320, "y": 220, "rotation": 0, "scaleX": 1, "scaleY": 1 },
    { "type": "DOOR", "x": 300, "y": 250, "rotation": 90, "scaleX": 1, "scaleY": 1 }
  ]
}
Return ONLY valid JSON.
`;