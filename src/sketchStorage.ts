import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SavedSketch, SketchSummary, Stroke } from './types';

const INDEX_KEY = 'drawpad:sketch-index';
const sketchKey = (id: string) => `drawpad:sketch:${id}`;

async function readIndex(): Promise<SketchSummary[]> {
  const raw = await AsyncStorage.getItem(INDEX_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as SketchSummary[];
}

async function writeIndex(index: SketchSummary[]): Promise<void> {
  await AsyncStorage.setItem(INDEX_KEY, JSON.stringify(index));
}

/** Saves `strokes` under `id` if given (overwriting), otherwise creates a new sketch. Returns the id used. */
export async function saveSketch(id: string | null, strokes: Stroke[]): Promise<string> {
  const index = await readIndex();
  const existing = id ? index.find((entry) => entry.id === id) : undefined;
  const sketchId = existing?.id ?? id ?? `sketch-${Date.now()}`;
  const createdAt = existing?.createdAt ?? Date.now();

  const sketch: SavedSketch = { id: sketchId, createdAt, strokes };
  await AsyncStorage.setItem(sketchKey(sketchId), JSON.stringify(sketch));

  if (!existing) {
    await writeIndex([{ id: sketchId, createdAt }, ...index]);
  }

  return sketchId;
}

export async function listSketches(): Promise<SketchSummary[]> {
  const index = await readIndex();
  return [...index].sort((a, b) => b.createdAt - a.createdAt);
}

export async function loadSketch(id: string): Promise<SavedSketch | null> {
  const raw = await AsyncStorage.getItem(sketchKey(id));
  if (!raw) return null;
  return JSON.parse(raw) as SavedSketch;
}
