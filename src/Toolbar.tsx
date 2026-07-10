import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Tool } from './types';

const COLORS = ['#111111', '#e03131', '#1971c2', '#2f9e44', '#f08c00'];
const WIDTHS = [2, 4, 8];
const TOOLS: Tool[] = ['pen', 'text'];

interface ToolbarProps {
  tool: Tool;
  onToolChange: (tool: Tool) => void;
  color: string;
  onColorChange: (color: string) => void;
  strokeWidth: number;
  onStrokeWidthChange: (width: number) => void;
  onClear: () => void;
  onSave: () => void;
  saving: boolean;
  onShowLiveView: () => void;
}

export function Toolbar({
  tool,
  onToolChange,
  color,
  onColorChange,
  strokeWidth,
  onStrokeWidthChange,
  onClear,
  onSave,
  saving,
  onShowLiveView,
}: ToolbarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {TOOLS.map((t) => (
          <Pressable
            key={t}
            onPress={() => onToolChange(t)}
            style={[styles.toolButton, t === tool && styles.toolButtonActive]}
          >
            <Text style={[styles.toolText, t === tool && styles.toolTextActive]}>
              {t === 'pen' ? 'Pen' : 'Text'}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.row}>
        {COLORS.map((c) => (
          <Pressable
            key={c}
            onPress={() => onColorChange(c)}
            style={[
              styles.swatch,
              { backgroundColor: c },
              c === color && styles.swatchActive,
            ]}
          />
        ))}
      </View>
      {tool === 'pen' && (
        <View style={styles.row}>
          {WIDTHS.map((w) => (
            <Pressable
              key={w}
              onPress={() => onStrokeWidthChange(w)}
              style={[styles.widthButton, w === strokeWidth && styles.widthButtonActive]}
            >
              <View
                style={{
                  width: w * 2,
                  height: w * 2,
                  borderRadius: w,
                  backgroundColor: '#111111',
                }}
              />
            </Pressable>
          ))}
        </View>
      )}
      <View style={styles.row}>
        <Pressable onPress={onShowLiveView} style={styles.actionButton}>
          <Text style={styles.actionText}>Live</Text>
        </Pressable>
        <Pressable onPress={onClear} style={styles.actionButton}>
          <Text style={styles.actionText}>Clear</Text>
        </Pressable>
        <Pressable onPress={onSave} style={styles.actionButton} disabled={saving}>
          <Text style={styles.actionText}>{saving ? 'Saving…' : 'Save'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#dddddd',
    backgroundColor: '#fafafa',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toolButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dddddd',
  },
  toolButtonActive: {
    backgroundColor: '#1971c2',
    borderColor: '#1971c2',
  },
  toolText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333333',
  },
  toolTextActive: {
    color: '#ffffff',
  },
  swatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  swatchActive: {
    borderColor: '#333333',
  },
  widthButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  widthButtonActive: {
    borderColor: '#333333',
  },
  actionButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1971c2',
  },
});
