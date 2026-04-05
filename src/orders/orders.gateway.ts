import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

export interface OrderCreatedSocketPayload {
  id: string;
  orderCode: string;
  status: string;
  itemsCount: number;
  finalTotal: number;
  createdAt: string;
}

const resolveCorsOrigins = () => {
  const corsOriginsEnv =
    process.env.CORS_ORIGINS ||
    'http://localhost:5173,http://127.0.0.1:5173';

  return corsOriginsEnv
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

@WebSocketGateway({
  namespace: '/orders',
  cors: {
    origin: resolveCorsOrigins(),
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingInterval: 25000,
  pingTimeout: 60000,
})
export class OrdersGateway implements OnGatewayConnection {
  @WebSocketServer()
  private server!: Server;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string) ||
        (client.handshake.headers?.authorization?.replace('Bearer ', '') ?? '');

      if (!token) {
        client.disconnect();
        return;
      }

      this.jwtService.verify(token, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      });
    } catch {
      client.disconnect();
    }
  }

  emitOrderCreated(payload: OrderCreatedSocketPayload): void {
    this.server.emit('orders:new', payload);
  }
}
