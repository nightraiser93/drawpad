import TcpSocket from 'react-native-tcp-socket';
import type Socket from 'react-native-tcp-socket/lib/types/Socket';
import type Server from 'react-native-tcp-socket/lib/types/Server';
import { concatBytes, utf8Encode } from './bytes';
import { tryParseHttpHeaders } from './httpRequest';
import { computeAcceptKey } from './wsHandshake';
import { decodeFrame, encodeFrame, encodeTextFrame, OPCODE_CLOSE, OPCODE_PING, OPCODE_PONG } from './wsFrame';
import { getViewerHtml } from './viewerHtml';
import type { StrokeEvent } from './strokeEvents';

const VIEWER_HTML = getViewerHtml();

type ConnectionPhase = 'awaiting-http' | 'open' | 'closed';

interface Connection {
  socket: Socket;
  phase: ConnectionPhase;
  httpBuffer: Uint8Array;
  frameBuffer: Uint8Array;
}

export class LanServer {
  private server: Server | null = null;
  private connections = new Set<Connection>();

  constructor(
    private readonly port: number,
    private readonly token: string
  ) {}

  start(): void {
    if (this.server) return;

    this.server = TcpSocket.createServer((socket) => {
      const connection: Connection = {
        socket,
        phase: 'awaiting-http',
        httpBuffer: new Uint8Array(0),
        frameBuffer: new Uint8Array(0),
      };
      this.connections.add(connection);

      socket.on('data', (data) => {
        const chunk: Uint8Array = typeof data === 'string' ? utf8Encode(data) : data;
        this.handleData(connection, chunk);
      });
      socket.on('close', () => this.connections.delete(connection));
      socket.on('error', () => this.connections.delete(connection));
    });

    this.server.listen({ port: this.port, host: '0.0.0.0' });
  }

  stop(): void {
    for (const connection of this.connections) {
      connection.socket.destroy();
    }
    this.connections.clear();
    this.server?.close();
    this.server = null;
  }

  broadcast(event: StrokeEvent): void {
    const frame = encodeTextFrame(JSON.stringify(event));
    for (const connection of this.connections) {
      if (connection.phase === 'open') {
        connection.socket.write(frame);
      }
    }
  }

  private handleData(connection: Connection, chunk: Uint8Array): void {
    if (connection.phase === 'awaiting-http') {
      connection.httpBuffer = concatBytes([connection.httpBuffer, chunk]);
      const request = tryParseHttpHeaders(connection.httpBuffer);
      if (!request) return;

      if (request.query.t !== this.token) {
        connection.socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');
        connection.socket.end();
        return;
      }

      const isUpgrade = (request.headers['upgrade'] ?? '').toLowerCase() === 'websocket';
      if (isUpgrade) {
        const clientKey = request.headers['sec-websocket-key'];
        if (!clientKey) {
          connection.socket.end();
          return;
        }
        const acceptKey = computeAcceptKey(clientKey);
        connection.socket.write(
          'HTTP/1.1 101 Switching Protocols\r\n' +
            'Upgrade: websocket\r\n' +
            'Connection: Upgrade\r\n' +
            `Sec-WebSocket-Accept: ${acceptKey}\r\n\r\n`
        );
        connection.phase = 'open';
      } else {
        const body = utf8Encode(VIEWER_HTML);
        connection.socket.write(
          'HTTP/1.1 200 OK\r\n' +
            'Content-Type: text/html; charset=utf-8\r\n' +
            `Content-Length: ${body.length}\r\n` +
            'Connection: close\r\n\r\n'
        );
        connection.socket.write(body);
        connection.socket.end();
      }
      return;
    }

    if (connection.phase === 'open') {
      connection.frameBuffer = concatBytes([connection.frameBuffer, chunk]);
      this.drainFrames(connection);
    }
  }

  private drainFrames(connection: Connection): void {
    for (;;) {
      const result = decodeFrame(connection.frameBuffer);
      if (!result) return;

      connection.frameBuffer = connection.frameBuffer.subarray(result.bytesConsumed);
      const { opcode, payload } = result.frame;

      if (opcode === OPCODE_CLOSE) {
        connection.socket.write(encodeFrame(OPCODE_CLOSE, new Uint8Array(0)));
        connection.socket.end();
        connection.phase = 'closed';
        return;
      }
      if (opcode === OPCODE_PING) {
        connection.socket.write(encodeFrame(OPCODE_PONG, payload));
      }
      // Text frames from the viewer are ignored — view-only for this slice.
    }
  }
}
