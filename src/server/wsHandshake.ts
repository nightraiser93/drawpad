import { sha1 } from 'js-sha1';
import { base64Encode } from './bytes';

const WEBSOCKET_MAGIC_STRING = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

export function computeAcceptKey(clientKey: string): string {
  const digestBytes = sha1.array(clientKey + WEBSOCKET_MAGIC_STRING);
  return base64Encode(Uint8Array.from(digestBytes));
}
