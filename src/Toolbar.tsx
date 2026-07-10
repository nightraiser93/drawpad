import { Pressable, StyleSheet, Text, View } from 'react-native';

const COLORS = ['#111111', '#e03131', '#1971c2', '#2f9e44', '#f08c00'];
const WIDTHS = [2, 4, 8];

interface ToolbarProps {
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#dddddd',
    backgroundColor: '#fafafa',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
