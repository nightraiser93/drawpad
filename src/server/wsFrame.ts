import { concatBytes, readUInt16BE, readUInt32BE, utf8Encode, writeUInt16BE, writeUInt32BE } from './bytes';

export const OPCODE_TEXT = 0x1;
export const OPCODE_CLOSE = 0x8;
export const OPCODE_PING = 0x9;
export const OPCODE_PONG = 0xa;

export interface DecodedFrame {
  fin: boolean;
  opcode: number;
  payload: Uint8Array;
}

/** Encodes a single unmasked frame — server-to-client frames must not be masked. */
export function encodeFrame(opcode: number, payload: Uint8Array): Uint8Array {
  const length = payload.length;
  let header: Uint8Array;

  if (length < 126) {
    header = Uint8Array.of(0x80 | opcode, length);
  } else if (length < 65536) {
    header = concatBytes([Uint8Array.of(0x80 | opcode, 126), writeUInt16BE(length)]);
  } else {
    header = concatBytes([Uint8Array.of(0x80 | opcode, 127), writeUInt32BE(0), writeUInt32BE(length)]);
  }

  return concatBytes([header, payload]);
}

export function encodeTextFrame(text: string): Uint8Array {
  return encodeFrame(OPCODE_TEXT, utf8Encode(text));
}

/**
 * Attempts to decode a single frame from the front of `bytes`. Client-to-server
 * frames are always masked. Returns null if `bytes` doesn't yet hold a full frame.
 */
export function decodeFrame(bytes: Uint8Array): { frame: DecodedFrame; bytesConsumed: number } | null {
  if (bytes.length < 2) return null;

  const fin = (bytes[0] & 0x80) !== 0;
  const opcode = bytes[0] & 0x0f;
  const masked = (bytes[1] & 0x80) !== 0;
  let payloadLength = bytes[1] & 0x7f;
  let offset = 2;

  if (payloadLength === 126) {
    if (bytes.length < offset + 2) return null;
    payloadLength = readUInt16BE(bytes, offset);
    offset += 2;
  } else if (payloadLength === 127) {
    if (bytes.length < offset + 8) return null;
    payloadLength = readUInt32BE(bytes, offset + 4);
    offset += 8;
  }

  let maskKey: Uint8Array | null = null;
  if (masked) {
    if (bytes.length < offset + 4) return null;
    maskKey = bytes.subarray(offset, offset + 4);
    offset += 4;
  }

  if (bytes.length < offset + payloadLength) return null;

  let payload = bytes.subarray(offset, offset + payloadLength);
  if (maskKey) {
    const unmasked = new Uint8Array(payloadLength);
    for (let i = 0; i < payloadLength; i++) {
      unmasked[i] = payload[i] ^ maskKey[i % 4];
    }
    payload = unmasked;
  }

  return { frame: { fin, opcode, payload }, bytesConsumed: offset + payloadLength };
}
