import { File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import type { SkImage } from '@shopify/react-native-skia';

export async function saveSketchToGallery(image: SkImage): Promise<void> {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Photo library permission not granted');
  }

  const bytes = image.encodeToBytes();
  const file = new File(Paths.cache, `sketch-${Date.now()}.png`);
  file.create();
  file.write(bytes);

  await MediaLibrary.saveToLibraryAsync(file.uri);
}
