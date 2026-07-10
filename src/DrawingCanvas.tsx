import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Canvas, Path, useCanvasRef, SkImage } from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { pathFromPoints } from './pathFromPoints';
import type { Point, Stroke } from './types';
import type { StrokeEvent } from './server/strokeEvents';

export interface DrawingCanvasHandle {
  clear: () => void;
  snapshot: () => SkImage | null;
  getStrokes: () => Stroke[];
  loadStrokes: (strokes: Stroke[]) => void;
}

interface DrawingCanvasProps {
  color: string;
  strokeWidth: number;
  onStrokeEvent?: (event: StrokeEvent) => void;
}

let strokeIdCounter = 0;
function nextStrokeId(): string {
  strokeIdCounter += 1;
  return `stroke-${Date.now()}-${strokeIdCounter}`;
}

export const DrawingCanvas = forwardRef<DrawingCanvasHandle, DrawingCanvasProps>(
  ({ color, strokeWidth, onStrokeEvent }, ref) => {
    const canvasRef = useCanvasRef();
    const [strokes, setStrokes] = useState<Stroke[]>([]);
    const currentPoints = useRef<Point[]>([]);
    const currentStrokeId = useRef<string>('');
    const [activeStroke, setActiveStroke] = useState<Stroke | null>(null);

    useImperativeHandle(ref, () => ({
      clear: () => {
        setStrokes([]);
        setActiveStroke(null);
        onStrokeEvent?.({ type: 'clear' });
      },
      snapshot: () => canvasRef.current?.makeImageSnapshot() ?? null,
      getStrokes: () => strokes,
      loadStrokes: (loaded) => {
        setStrokes(loaded);
        setActiveStroke(null);
        onStrokeEvent?.({ type: 'clear' });
        for (const stroke of loaded) {
          onStrokeEvent?.({
            type: 'strokeStart',
            id: stroke.id,
            color: stroke.color,
            strokeWidth: stroke.strokeWidth,
            point: stroke.points[0] ?? { x: 0, y: 0 },
          });
          for (const point of stroke.points.slice(1)) {
            onStrokeEvent?.({ type: 'strokePoint', id: stroke.id, point });
          }
          onStrokeEvent?.({ type: 'strokeEnd', id: stroke.id });
        }
      },
    }));

    const pan = Gesture.Pan()
      .onBegin((e) => {
        const id = nextStrokeId();
        currentStrokeId.current = id;
        currentPoints.current = [{ x: e.x, y: e.y }];
        setActiveStroke({
          id,
          color,
          strokeWidth,
          points: [...currentPoints.current],
        });
        onStrokeEvent?.({ type: 'strokeStart', id, color, strokeWidth, point: { x: e.x, y: e.y } });
      })
      .onUpdate((e) => {
        currentPoints.current = [...currentPoints.current, { x: e.x, y: e.y }];
        setActiveStroke((prev) =>
          prev ? { ...prev, points: currentPoints.current } : prev
        );
        onStrokeEvent?.({ type: 'strokePoint', id: currentStrokeId.current, point: { x: e.x, y: e.y } });
      })
      .onEnd(() => {
        const id = currentStrokeId.current;
        setActiveStroke((prev) => {
          if (prev) setStrokes((all) => [...all, prev]);
          return null;
        });
        currentPoints.current = [];
        onStrokeEvent?.({ type: 'strokeEnd', id });
      })
      .minDistance(0);

    return (
      <GestureDetector gesture={pan}>
        <Canvas ref={canvasRef} style={styles.canvas}>
          {strokes.map((stroke) => (
            <Path
              key={stroke.id}
              path={pathFromPoints(stroke.points)}
              color={stroke.color}
              style="stroke"
              strokeWidth={stroke.strokeWidth}
              strokeCap="round"
              strokeJoin="round"
            />
          ))}
          {activeStroke && (
            <Path
              path={pathFromPoints(activeStroke.points)}
              color={activeStroke.color}
              style="stroke"
              strokeWidth={activeStroke.strokeWidth}
              strokeCap="round"
              strokeJoin="round"
            />
          )}
        </Canvas>
      </GestureDetector>
    );
  }
);

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});
