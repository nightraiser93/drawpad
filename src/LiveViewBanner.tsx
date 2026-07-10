import { Pressable, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

interface LiveViewBannerProps {
  url: string | null;
  visible: boolean;
  onDismiss: () => void;
}

export function LiveViewBanner({ url, visible, onDismiss }: LiveViewBannerProps) {
  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.title}>Watch live on this wifi</Text>
        {url ? (
          <>
            <QRCode value={url} size={160} />
            <Text style={styles.url}>{url}</Text>
          </>
        ) : (
          <Text style={styles.url}>Starting…</Text>
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
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  url: {
    fontSize: 13,
    color: '#555555',
    maxWidth: 220,
    textAlign: 'center',
  },
  dismiss: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  dismissText: {
    color: '#1971c2',
    fontWeight: '600',
  },
});
