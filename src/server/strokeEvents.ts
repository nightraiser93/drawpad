import type { Point } from '../types';

export type StrokeEvent =
  | { type: 'strokeStart'; id: string; color: string; strokeWidth: number; point: Point }
  | { type: 'strokePoint'; id: string; point: Point }
  | { type: 'strokeEnd'; id: string }
  | { type: 'clear' };
