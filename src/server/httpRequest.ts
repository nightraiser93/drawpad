import { utf8Decode } from './bytes';

export interface ParsedRequest {
  method: string;
  path: string;
  query: Record<string, string>;
  headers: Record<string, string>;
}

const HEADER_TERMINATOR = '\r\n\r\n';

/** Returns null if the bytes don't yet contain a full header block. */
export function tryParseHttpHeaders(bytes: Uint8Array): ParsedRequest | null {
  const text = utf8Decode(bytes);
  const terminatorIndex = text.indexOf(HEADER_TERMINATOR);
  if (terminatorIndex === -1) return null;

  const headerBlock = text.slice(0, terminatorIndex);
  const lines = headerBlock.split('\r\n');
  const requestLine = lines[0] ?? '';
  const [method = 'GET', fullPath = '/'] = requestLine.split(' ');

  const [path, queryString = ''] = fullPath.split('?');
  const query: Record<string, string> = {};
  for (const pair of queryString.split('&')) {
    if (!pair) continue;
    const [key, value = ''] = pair.split('=');
    query[decodeURIComponent(key)] = decodeURIComponent(value);
  }

  const headers: Record<string, string> = {};
  for (const line of lines.slice(1)) {
    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) continue;
    const key = line.slice(0, separatorIndex).trim().toLowerCase();
    const value = line.slice(separatorIndex + 1).trim();
    headers[key] = value;
  }

  return { method, path, query, headers };
}
