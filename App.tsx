import { useRef, useState } from 'react';
import { Alert, SafeAreaView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DrawingCanvas, DrawingCanvasHandle } from './src/DrawingCanvas';
import { Toolbar } from './src/Toolbar';
import { LiveViewBanner } from './src/LiveViewBanner';
import { SketchListModal } from './src/SketchListModal';
import { saveSketchToGallery } from './src/saveSketch';
import { useLanServer } from './src/useLanServer';
import { listSketches, loadSketch, saveSketch } from './src/sketchStorage';
import type { SketchSummary } from './src/types';

export default function App() {
  const canvasRef = useRef<DrawingCanvasHandle>(null);
  const [color, setColor] = useState('#111111');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [saving, setSaving] = useState(false);
  const [showLiveView, setShowLiveView] = useState(false);
  const [showSketchList, setShowSketchList] = useState(false);
  const [sketches, setSketches] = useState<SketchSummary[]>([]);
  const currentSketchId = useRef<string | null>(null);
  const { url, broadcastStroke } = useLanServer();

  const handleSave = async () => {
    const image = canvasRef.current?.snapshot();
    const strokes = canvasRef.current?.getStrokes() ?? [];
    if (!image || strokes.length === 0) {
      Alert.alert('Nothing to save', 'Draw something first.');
      return;
    }
    setSaving(true);
    try {
      await saveSketchToGallery(image);
      currentSketchId.current = await saveSketch(currentSketchId.current, strokes);
      Alert.alert('Saved', 'Sketch saved to your photo library and can be reopened later.');
    } catch (err) {
      Alert.alert('Save failed', err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleOpenSketches = async () => {
    setSketches(await listSketches());
    setShowSketchList(true);
  };

  const handleSelectSketch = async (id: string) => {
    const sketch = await loadSketch(id);
    setShowSketchList(false);
    if (!sketch) {
      Alert.alert('Not found', 'That sketch could not be loaded.');
      return;
    }
    currentSketchId.current = sketch.id;
    canvasRef.current?.loadStrokes(sketch.strokes);
  };

  const handleClear = () => {
    canvasRef.current?.clear();
    currentSketchId.current = null;
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaView style={styles.root}>
        <DrawingCanvas
          ref={canvasRef}
          color={color}
          strokeWidth={strokeWidth}
          onStrokeEvent={broadcastStroke}
        />
        <Toolbar
          color={color}
          onColorChange={setColor}
          strokeWidth={strokeWidth}
          onStrokeWidthChange={setStrokeWidth}
          onClear={handleClear}
          onSave={handleSave}
          saving={saving}
          onShowLiveView={() => setShowLiveView(true)}
          onOpenSketches={handleOpenSketches}
        />
        <LiveViewBanner
          url={url}
          visible={showLiveView}
          onDismiss={() => setShowLiveView(false)}
        />
        <SketchListModal
          visible={showSketchList}
          sketches={sketches}
          onSelect={handleSelectSketch}
          onDismiss={() => setShowSketchList(false)}
        />
        <StatusBar style="auto" />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});
