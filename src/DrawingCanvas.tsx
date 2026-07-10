import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Canvas, Path, Skia, Text as SkiaText, useCanvasRef, SkImage } from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { pathFromPoints } from './pathFromPoints';
import { TextOverlayInput } from './TextOverlayInput';
import type { Point, Stroke, TextElement, Tool } from './types';
import type { StrokeEvent } from './server/strokeEvents';

const TEXT_FONT_SIZE = 20;

export interface DrawingCanvasHandle {
  clear: () => void;
  snapshot: () => SkImage | null;
  getStrokes: () => Stroke[];
  loadStrokes: (strokes: Stroke[]) => void;
  getTextElements: () => TextElement[];
  loadTextElements: (elements: TextElement[]) => void;
}

interface DrawingCanvasProps {
  color: string;
  strokeWidth: number;
  tool: Tool;
  onStrokeEvent?: (event: StrokeEvent) => void;
}

let strokeIdCounter = 0;
function nextStrokeId(): string {
  strokeIdCounter += 1;
  return `stroke-${Date.now()}-${strokeIdCounter}`;
}

let textIdCounter = 0;
function nextTextId(): string {
  textIdCounter += 1;
  return `text-${Date.now()}-${textIdCounter}`;
}

function hitTestText(elements: TextElement[], x: number, y: number): TextElement | null {
  for (let i = elements.length - 1; i >= 0; i--) {
    const el = elements[i];
    const width = Math.max(el.text.length * el.fontSize * 0.55, 20);
    const height = el.fontSize * 1.3;
    if (x >= el.x && x <= el.x + width && y >= el.y - height && y <= el.y + height * 0.3) {
      return el;
    }
  }
  return null;
}

export const DrawingCanvas = forwardRef<DrawingCanvasHandle, DrawingCanvasProps>(
  ({ color, strokeWidth, tool, onStrokeEvent }, ref) => {
    const canvasRef = useCanvasRef();
    const font = useMemo(() => Skia.Font(undefined, TEXT_FONT_SIZE), []);

    const [strokes, setStrokes] = useState<Stroke[]>([]);
    const currentPoints = useRef<Point[]>([]);
    const currentStrokeId = useRef<string>('');
    const [activeStroke, setActiveStroke] = useState<Stroke | null>(null);

    const [textElements, setTextElements] = useState<TextElement[]>([]);
    const [editingText, setEditingText] = useState<{ id: string | null; x: number; y: number; text: string } | null>(
      null
    );

    useImperativeHandle(ref, () => ({
      clear: () => {
        setStrokes([]);
        setActiveStroke(null);
        setTextElements([]);
        setEditingText(null);
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
      getTextElements: () => textElements,
      loadTextElements: (loaded) => {
        setTextElements(loaded);
        setEditingText(null);
      },
    }));

    const pan = Gesture.Pan()
      .enabled(tool === 'pen')
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

    const tap = Gesture.Tap()
      .enabled(tool === 'text')
      .onEnd((e) => {
        const hit = hitTestText(textElements, e.x, e.y);
        if (hit) {
          setEditingText({ id: hit.id, x: hit.x, y: hit.y, text: hit.text });
        } else {
          setEditingText({ id: null, x: e.x, y: e.y, text: '' });
        }
      });

    const gesture = Gesture.Race(pan, tap);

    const commitText = (x: number, y: number, text: string) => {
      setEditingText((current) => {
        if (!current) return null;
        if (!text) {
          if (current.id) {
            setTextElements((all) => all.filter((el) => el.id !== current.id));
          }
          return null;
        }
        const id = current.id ?? nextTextId();
        const element: TextElement = { id, x, y, text, color, fontSize: TEXT_FONT_SIZE };
        setTextElements((all) => {
          const exists = all.some((el) => el.id === id);
          return exists ? all.map((el) => (el.id === id ? element : el)) : [...all, element];
        });
        return null;
      });
    };

    return (
      <View style={styles.container}>
        <GestureDetector gesture={gesture}>
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
            {textElements
              .filter((el) => el.id !== editingText?.id)
              .map((el) => (
                <SkiaText key={el.id} x={el.x} y={el.y} text={el.text} color={el.color} font={font} />
              ))}
          </Canvas>
        </GestureDetector>
        {editingText && (
          <TextOverlayInput
            x={editingText.x}
            y={editingText.y}
            text={editingText.text}
            color={color}
            fontSize={TEXT_FONT_SIZE}
            onCommit={commitText}
          />
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  canvas: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});
