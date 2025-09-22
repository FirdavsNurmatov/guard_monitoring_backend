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
import { BadRequestException, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CheckpointStatus } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';

@WebSocketGateway({ cors: { origin: '*' } })
@Injectable()
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private prisma: PrismaService) {}

  afterInit() {
    console.log('🚀 WebSocket Gateway Initialized');
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('ping')
  handlePing(@MessageBody() data: string, @ConnectedSocket() client: Socket) {
    console.log('Received:', data);
    client.emit('pong', { message: 'Hello from server!' });
  }

  @SubscribeMessage('guard_checkin')
  async handleGuardCheckin(
    @MessageBody() data: any,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      let parsedData: {
        userId: number;
        checkpointCardNum: string;
      };
      if (typeof data === 'string') {
        try {
          parsedData = JSON.parse(data);
        } catch (err) {
          console.error('❌ Invalid JSON string:', data);
          client.emit('checkin_ack', { success: false, error: 'Invalid JSON' });
          return;
        }
      } else {
        parsedData = data;
      }

      const { userId, checkpointCardNum } = parsedData;

      if (!userId || !checkpointCardNum) {
        client.emit('checkin_ack', {
          success: false,
          error: 'userId and checkpointCardNum required',
        });
        return;
      }

      const user = await this.prisma.users.findUnique({
        where: { id: userId },
      });
      if (!user) {
        client.emit('checkin_ack', {
          success: false,
          error: 'Guard does not exist',
        });
        return;
      } else if (user.role != 'GUARD') {
        client.emit('checkin_ack', {
          success: false,
          error: 'User must be Guard',
        });
        return;
      }

      const checkpoint = await this.prisma.checkpoints.findUnique({
        where: { card_number: checkpointCardNum },
      });
      if (!checkpoint) {
        client.emit('checkin_ack', {
          success: false,
          error: 'Checkpoint does not exist',
        });
        return;
      }

      const res = await this.prisma.monitoringLog.create({
        data: {
          userId,
          checkpointId: checkpoint.id,
          status: CheckpointStatus.ON_TIME,
        },
        include: {
          user: { select: { id: true, username: true } },
          checkpoint: {
            select: { id: true, name: true, position: true },
          },
        },
      });

      client.emit('checkin_ack', { success: true, res });
    } catch (error) {
      console.log(error);
      client.emit('checkin_ack', { success: false, message: error.message });
    }
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  async checkGuardStatus() {
    try {
      const checkpoints = await this.prisma.checkpoints.findMany({
        include: {
          MonitoringLog: {
            orderBy: { createdAt: 'desc' },
            take: 1, // faqat oxirgi log
          },
        },
      });

      const now = new Date();

      for (const checkpoint of checkpoints) {
        const lastLog = checkpoint.MonitoringLog[0];

        if (!lastLog || lastLog.status == 'MISSED') continue; // log yo‘q bo‘lsa tekshirmaymiz

        const diffMinutes = Math.floor(
          (now.getTime() - lastLog.createdAt.getTime()) / (1000 * 60) + 0.06,
        );

        let status: 'ON_TIME' | 'LATE' | 'MISSED' = 'ON_TIME';

        if (diffMinutes >= checkpoint.pass_time && lastLog.status == 'LATE') {
          status = 'MISSED';
        } else if (diffMinutes >= checkpoint.normal_time) {
          status = 'LATE';
        }

        if (status !== 'ON_TIME' && lastLog.status !== status) {
          const res = await this.prisma.monitoringLog.create({
            data: {
              status,
              checkpointId: checkpoint.id,
              userId: lastLog.userId,
            },
          });
          console.log(res);
        }

        console.log(
          `[${new Date().toLocaleTimeString('uz-UZ')}]`,
          'Checkpoint:',
          checkpoint.name,
          '| Diff:',
          diffMinutes,
          '| Normal:',
          checkpoint.normal_time,
          '| Pass:',
          checkpoint.pass_time,
          '| Status:',
          lastLog.status,
        );
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
