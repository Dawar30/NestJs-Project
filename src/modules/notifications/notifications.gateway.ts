import {
  Logger,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/notifications',
})
@UsePipes(new ValidationPipe({ transform: true }))
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const authHeader =
        (client.handshake.auth?.token as string) ||
        (client.handshake.headers?.authorization as string);

      if (!authHeader) {
        this.logger.warn(`Unauthorized WS connection attempt from ${client.id}`);
        client.disconnect(true);
        return;
      }

      const token = authHeader.replace(/^Bearer\s+/i, '');
      const secret =
        this.configService.get<string>('JWT_ACCESS_SECRET') ||
        'super-secret-access-key-change-in-production';

      const payload = await this.jwtService.verifyAsync(token, { secret });
      const userId = payload.sub;

      client.data.userId = userId;
      // Join a dedicated room for this user
      await client.join(`user:${userId}`);
      this.logger.log(`WS Client connected: ${client.id} (User: ${userId})`);
    } catch {
      this.logger.warn(`WS Token verification failed for client: ${client.id}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`WS Client disconnected: ${client.id}`);
  }

  sendNotificationToUser(userId: string, notification: any) {
    if (this.server) {
      this.server.to(`user:${userId}`).emit('notification', notification);
    }
  }
}
