export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  id: string;
  color: string;
  strokeWidth: number;
  points: Point[];
}

export interface TextElement {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
}

export type Tool = 'pen' | 'text';
