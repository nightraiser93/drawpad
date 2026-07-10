import { Skia, SkPath } from '@shopify/react-native-skia';
import type { Point } from './types';

export function pathFromPoints(points: Point[]): SkPath {
  const path = Skia.Path.Make();
  if (points.length === 0) return path;

  path.moveTo(points[0].x, points[0].y);
  if (points.length === 1) {
    path.lineTo(points[0].x, points[0].y);
    return path;
  }

  for (let i = 1; i < points.length - 1; i++) {
    const mid = {
      x: (points[i].x + points[i + 1].x) / 2,
      y: (points[i].y + points[i + 1].y) / 2,
    };
    path.quadTo(points[i].x, points[i].y, mid.x, mid.y);
  }
  const last = points[points.length - 1];
  path.lineTo(last.x, last.y);

  return path;
}
