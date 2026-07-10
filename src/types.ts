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
