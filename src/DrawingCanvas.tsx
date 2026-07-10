import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Canvas, Path, useCanvasRef, SkImage } from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { pathFromPoints } from './pathFromPoints';
import type { Point, Stroke } from './types';

export interface DrawingCanvasHandle {
  clear: () => void;
  snapshot: () => SkImage | null;
}

interface DrawingCanvasProps {
  color: string;
  strokeWidth: number;
}

let strokeIdCounter = 0;
function nextStrokeId(): string {
  strokeIdCounter += 1;
  return `stroke-${Date.now()}-${strokeIdCounter}`;
}

export const DrawingCanvas = forwardRef<DrawingCanvasHandle, DrawingCanvasProps>(
  ({ color, strokeWidth }, ref) => {
    const canvasRef = useCanvasRef();
    const [strokes, setStrokes] = useState<Stroke[]>([]);
    const currentPoints = useRef<Point[]>([]);
    const [activeStroke, setActiveStroke] = useState<Stroke | null>(null);

    useImperativeHandle(ref, () => ({
      clear: () => setStrokes([]),
      snapshot: () => canvasRef.current?.makeImageSnapshot() ?? null,
    }));

    const pan = Gesture.Pan()
      .onBegin((e) => {
        currentPoints.current = [{ x: e.x, y: e.y }];
        setActiveStroke({
          id: nextStrokeId(),
          color,
          strokeWidth,
          points: [...currentPoints.current],
        });
      })
      .onUpdate((e) => {
        currentPoints.current = [...currentPoints.current, { x: e.x, y: e.y }];
        setActiveStroke((prev) =>
          prev ? { ...prev, points: currentPoints.current } : prev
        );
      })
      .onEnd(() => {
        setActiveStroke((prev) => {
          if (prev) setStrokes((all) => [...all, prev]);
          return null;
        });
        currentPoints.current = [];
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
