import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as Network from 'expo-network';
import { LanServer } from './server/LanServer';
import { generateToken } from './server/token';
import type { StrokeEvent } from './server/strokeEvents';

const PORT = 8765;

export function useLanServer() {
  const serverRef = useRef<LanServer | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const startServer = async () => {
      if (serverRef.current) return;
      const ip = await Network.getIpAddressAsync();
      if (cancelled || !ip || serverRef.current) return;

      const token = generateToken();
      const server = new LanServer(PORT, token);
      server.start();
      serverRef.current = server;
      setUrl(`http://${ip}:${PORT}/?t=${token}`);
    };

    const stopServer = () => {
      serverRef.current?.stop();
      serverRef.current = null;
      setUrl(null);
    };

    startServer();

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        startServer();
      } else {
        stopServer();
      }
    });

    return () => {
      cancelled = true;
      subscription.remove();
      stopServer();
    };
  }, []);

  const broadcastStroke = (event: StrokeEvent) => {
    serverRef.current?.broadcast(event);
  };

  return { url, broadcastStroke };
}
