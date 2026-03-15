import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

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
})
export class OrdersGateway {
  @WebSocketServer()
  private server!: Server;

  emitOrderCreated(payload: OrderCreatedSocketPayload): void {
    this.server.emit('orders:new', payload);
  }
}
