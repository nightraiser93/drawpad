import { useRef, useState } from 'react';
import { TextInput } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

interface TextOverlayInputProps {
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
  onCommit: (x: number, y: number, text: string) => void;
}

export function TextOverlayInput({ x, y, text, color, fontSize, onCommit }: TextOverlayInputProps) {
  const [value, setValue] = useState(text);
  const [pos, setPos] = useState({ x, y });
  const dragStart = useRef({ x, y });

  const drag = Gesture.Pan()
    .onBegin(() => {
      dragStart.current = pos;
    })
    .onUpdate((e) => {
      setPos({ x: dragStart.current.x + e.translationX, y: dragStart.current.y + e.translationY });
    });

  const commit = () => {
    onCommit(pos.x, pos.y, value.trim());
  };

  return (
    <GestureDetector gesture={drag}>
      <TextInput
        autoFocus
        multiline
        value={value}
        onChangeText={setValue}
        onBlur={commit}
        onSubmitEditing={commit}
        style={{
          position: 'absolute',
          left: pos.x,
          top: pos.y - fontSize,
          minWidth: 80,
          fontSize,
          color,
          padding: 4,
          borderWidth: 1,
          borderColor: '#1971c2',
          borderStyle: 'dashed',
          backgroundColor: 'rgba(255,255,255,0.85)',
        }}
      />
    </GestureDetector>
  );
}
