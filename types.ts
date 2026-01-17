
export enum InteractionType {
  SWAP = 'SWAP',
  MOVE_POINTER = 'MOVE_POINTER',
  RESIZE_WINDOW = 'RESIZE_WINDOW',
  CONNECT = 'CONNECT',
  PARTITION = 'PARTITION',
  FLIP = 'FLIP',
  ORDER = 'ORDER',
  PUSH = 'PUSH',
  LINK = 'LINK'
}

export interface SimulationObject {
  id: string;
  type: 'circle' | 'square' | 'box' | 'pointer' | 'bracket' | 'tree-node' | 'path-arrow' | 'divisor' | 'line' | 'rectangle' | 'text-only' | 'container' | 'diamond' | 'hexagon' | 'star' | 'edge' | 'weight-label' | 'node' | 'vertex' | 'connection' | 'data-item';
  label: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  color?: string;
  groupId?: string;
  isLocked?: boolean;
  isHidden?: boolean;
  borderColor?: string;
  borderWidth?: number;
  opacity?: number;
  rotation?: number;
  canDragGroup?: boolean;
  currentAnchorId?: string; 
  sourceId?: string;
  targetId?: string;
  weight?: number;
  isDirected?: boolean;
  state?: 'default' | 'active' | 'visited' | 'queued' | 'error' | 'pivot';
}

export interface VictoryCriteria {
  requiredAnchors?: Record<string, string>;
  requiredOrder?: string[];
  targetPositions?: Record<string, { x: number; y?: number; tolerance: number }>;
}

export interface Scenario {
  id: string;
  name: string;
  initialState: { objects: SimulationObject[] };
  victoryCondition: {
    criteria: VictoryCriteria;
    explanation: string;
  };
}

export interface Puzzle {
  id: string;
  topic: string;
  title: string;
  challengeGoal: string;
  interactionMode: InteractionType;
  scenarios: Scenario[];
  explanation: string;
}

export interface UserStats {
  intuitionScore: number;
  streak: number;
  weaknesses: Record<string, number>;
}
