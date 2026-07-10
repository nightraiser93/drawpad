import { useRef, useState } from 'react';
import { Alert, SafeAreaView, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DrawingCanvas, DrawingCanvasHandle } from './src/DrawingCanvas';
import { Toolbar } from './src/Toolbar';
import { LiveViewBanner } from './src/LiveViewBanner';
import { saveSketchToGallery } from './src/saveSketch';
import { useLanServer } from './src/useLanServer';
import type { Tool } from './src/types';

export default function App() {
  const canvasRef = useRef<DrawingCanvasHandle>(null);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#111111');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [saving, setSaving] = useState(false);
  const [showLiveView, setShowLiveView] = useState(false);
  const { url, broadcastStroke } = useLanServer();

  const handleSave = async () => {
    const image = canvasRef.current?.snapshot();
    if (!image) {
      Alert.alert('Nothing to save', 'Draw something first.');
      return;
    }
    setSaving(true);
    try {
      await saveSketchToGallery(image);
      Alert.alert('Saved', 'Sketch saved to your photo library.');
    } catch (err) {
      Alert.alert('Save failed', err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaView style={styles.root}>
        <DrawingCanvas
          ref={canvasRef}
          tool={tool}
          color={color}
          strokeWidth={strokeWidth}
          onStrokeEvent={broadcastStroke}
        />
        <Toolbar
          tool={tool}
          onToolChange={setTool}
          color={color}
          onColorChange={setColor}
          strokeWidth={strokeWidth}
          onStrokeWidthChange={setStrokeWidth}
          onClear={() => canvasRef.current?.clear()}
          onSave={handleSave}
          saving={saving}
          onShowLiveView={() => setShowLiveView(true)}
        />
        <LiveViewBanner
          url={url}
          visible={showLiveView}
          onDismiss={() => setShowLiveView(false)}
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
