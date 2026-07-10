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

export interface SketchSummary {
  id: string;
  createdAt: number;
}

export interface SavedSketch extends SketchSummary {
  strokes: Stroke[];
}
