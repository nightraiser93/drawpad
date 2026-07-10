import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { SketchSummary } from './types';

interface SketchListModalProps {
  visible: boolean;
  sketches: SketchSummary[];
  onSelect: (id: string) => void;
  onDismiss: () => void;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

export function SketchListModal({ visible, sketches, onSelect, onDismiss }: SketchListModalProps) {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.title}>Saved sketches</Text>
        {sketches.length === 0 ? (
          <Text style={styles.empty}>No saved sketches yet.</Text>
        ) : (
          <FlatList
            style={styles.list}
            data={sketches}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable style={styles.row} onPress={() => onSelect(item.id)}>
                <Text style={styles.rowText}>{formatDate(item.createdAt)}</Text>
              </Pressable>
            )}
          />
        )}
        <Pressable onPress={onDismiss} style={styles.dismiss}>
          <Text style={styles.dismissText}>Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'stretch',
    gap: 12,
    maxHeight: '70%',
    width: '80%',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  empty: {
    fontSize: 13,
    color: '#555555',
    textAlign: 'center',
  },
  list: {
    flexGrow: 0,
  },
  row: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#dddddd',
  },
  rowText: {
    fontSize: 14,
    color: '#111111',
  },
  dismiss: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: 'center',
  },
  dismissText: {
    color: '#1971c2',
    fontWeight: '600',
  },
});
