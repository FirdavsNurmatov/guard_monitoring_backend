import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({ cors: { origin: '*' } })
@Injectable()
export class MonitoringGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private jwtService: JwtService) {}

  afterInit() {
    // pass this console.log for once info
    console.log('🚀 WebSocket Gateway Initialized');
  }

  handleConnection(client: Socket) {
    try {
      // console.log(`Client connected: ${client.id}`);
      const token = client.handshake.auth?.token;
      if (!token) {
        // console.log('❌ No token, disconnecting...');
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const { organizationId, userId } = payload;

      if (!organizationId) {
        // console.log('❌ No organizationId in token');
        client.disconnect();
        return;
      }

      const roomName = `org_${organizationId}`;
      // console.log(payload, roomName);
      client.join(roomName);
    } catch (error) {
      client.disconnect();
    }
  }
  handleDisconnect(client: Socket) {
    // console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('ping')
  handlePing(@MessageBody() data: string, @ConnectedSocket() client: Socket) {
    // console.log('Received:', data);
    client.emit('pong', { message: 'Hello from server!' });
  }

  // 🔥 loglarni faqat shu tenantga yuborish
  sendLog(log: any, organizationId: string) {
    // console.log(log, organizationId);
    this.server.to(`org_${organizationId}`).emit('logs', log);
    // this.server.emit('test', { ok: true });
  }

  sendGps(gpsLog: any, organizationId: string) {
    this.server.to(`org_${organizationId}`).emit('gps', gpsLog);
  }
}
