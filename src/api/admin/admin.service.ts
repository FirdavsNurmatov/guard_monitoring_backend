import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CheckinDto } from './dto/checkin/checkin.dto';
import { MonitoringGateway } from '../monitoring/monitoring.gateway';
import { CreateGpsLogDto } from './dto/gps/create-gps-log.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: MonitoringGateway,
  ) {}

  // Gps
  async create(userData: CreateGpsLogDto) {
    try {
      const data = await this.prisma.users.findUnique({
        where: { id: userData.userId },
      });

      if (!data) throw new NotFoundException('User not found');
      else if (data.role !== 'GUARD') throw new ForbiddenException('Forbidden');

      const gpsLog = await this.prisma.gpsLog.create({
        data: {
          userId: userData.userId,

          location: {
            lat: userData.location.lat,
            lng: userData.location.lng,
          } as any,
        },
      });

      this.gateway.sendGps(
        `gps:${userData.userId}`,
        String(data.organizationId),
      );

      return gpsLog;
    } catch (error) {
      if (error.message.includes('found'))
        throw new NotFoundException(error.message);
      else if (error.message == 'Forbidden')
        throw new ForbiddenException(error.message);
      throw new BadRequestException('Something went wrong');
    }
  }

  async findLatest(user: any, userId: number, limit = 50) {
    try {
      const userData = await this.prisma.users.findUnique({
        where: { id: userId },
      });
      if (!userData) {
        throw new NotFoundException('User not found');
      } else if (userData.organizationId !== user.organizationId) {
        throw new BadRequestException('Wrong organization');
      }

      return await this.prisma.gpsLog.findMany({
        where: { userId },
        select: { userId: true, location: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch (error) {
      if (error.message.includes('found'))
        throw new NotFoundException(error.message);
      throw new BadRequestException(error.message);
    }
  }

  async checkin(data: CheckinDto) {
    const { userId, checkpointCardNum } = data;

    if (!userId || !checkpointCardNum) {
      throw new BadRequestException('userId and checkpointCardNum required');
    }

    const user = await this.prisma.users.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new BadRequestException('Guard does not exist');
    }
    if (user.role !== 'GUARD') {
      throw new BadRequestException('User must be Guard');
    }

    const checkpoint = await this.prisma.checkpoints.findFirst({
      where: { cardNumber: checkpointCardNum },
      include: {
        monitoringLog: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        Object: true,
      },
    });

    if (!checkpoint) {
      throw new BadRequestException('Checkpoint does not exist');
    } else if (checkpoint?.Object.organizationId !== user.organizationId) {
      throw new BadRequestException("Another organization's checkpoint");
    }

    const lastLog = checkpoint.monitoringLog[0];
    let status: 'ON_TIME' | 'LATE' | 'MISSED' = 'ON_TIME';

    if (lastLog) {
      const diffMinutes = Math.floor(
        (new Date().getTime() - lastLog.createdAt.getTime()) / (1000 * 60),
      );

      if (diffMinutes >= checkpoint.normalTime) {
        status = 'LATE';

        if (diffMinutes >= checkpoint.normalTime + checkpoint.passTime) {
          status = 'MISSED';
        }
      } else {
        status = 'ON_TIME';
      }
    }

    // Agar oxirgi status bilan yangi status bir xil bo‘lsa ham yangi log yaratiladi
    const res = await this.prisma.monitoringLog.create({
      data: {
        userId,
        checkpointId: checkpoint.id,
        status,
      },
      include: {
        user: {
          select: {
            id: true,
            login: true,
            username: true,
            organizationId: true,
          },
        },
        checkpoint: {
          select: { objectId: true, id: true, name: true, position: true },
        },
      },
    });

    this.gateway.sendLog(res, String(res.user.organizationId));

    // console.log(
    //   `[${new Date().toLocaleTimeString('uz-UZ')}] Checkpoint:`,
    //   checkpoint.name,
    //   '| Status:',
    //   status,
    // );

    return { success: true, res };
  }

  async guardList() {
    try {
      const res = await this.prisma.users.findMany({
        where: { role: 'GUARD' },
        select: { login: true, username: true },
      });

      return res;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getGuardPositions() {
    try {
      const res = await this.prisma.monitoringLog
        .findMany({
          distinct: ['userId'],
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, username: true } },
            checkpoint: { select: { position: true } },
          },
        })
        .then((logs) =>
          logs.map((l) => ({
            guardId: l.userId,
            username: l.user.username,
            position: l.checkpoint.position,
          })),
        );

      return res;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findAllLogsWithQuery(options: {
    user: any;
    objectId: number;
    page: number;
    limit: number;
  }) {
    try {
      const { objectId, page, limit, user } = options;
      const objectData = await this.prisma.objects.findUnique({
        where: { id: objectId },
      });
      if (!objectData) {
        throw new NotFoundException('Object not found');
      } else if (objectData.organizationId !== user.organizationId) {
        throw new BadRequestException('Wrong orgazination');
      }

      const skip = (page - 1) * limit;

      // 1. Shu objectId ga tegishli checkpointlarni topamiz
      const checkpoints = await this.prisma.checkpoints.findMany({
        where: objectId ? { objectId } : undefined,
        select: { id: true },
      });

      const checkpointIds = checkpoints.map((c) => c.id);

      if (checkpointIds.length === 0) {
        return { data: [], total: 0, page, lastPage: 0 };
      }

      // 2. Har bir checkpoint uchun oxirgi log vaqtini topamiz
      const grouped = await this.prisma.monitoringLog.groupBy({
        by: ['checkpointId'],
        where: {
          checkpointId: { in: checkpointIds },
        },
        _max: { createdAt: true },
      });

      // 3. Oxirgi loglarni olaymiz
      const logs = await this.prisma.monitoringLog.findMany({
        where: {
          OR: grouped
            .filter((g) => g._max.createdAt !== null)
            .map((g) => ({
              checkpointId: g.checkpointId,
              createdAt: g._max.createdAt as Date,
            })),
        },
        include: {
          user: { select: { id: true, login: true, username: true } },
          checkpoint: { select: { id: true, name: true, position: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      });

      return {
        data: logs,
        total: grouped.length,
        page,
        lastPage: Math.ceil(grouped.length / limit),
      };
    } catch (error) {
      if (error.message.includes('found'))
        throw new NotFoundException(error.message);
      throw new BadRequestException(error.message);
    }
  }

  async findAllLogs(user: any, objectId: number, page: number, limit: number) {
    try {
      const objectData = await this.prisma.objects.findUnique({
        where: { id: objectId },
      });
      if (!objectData) {
        throw new NotFoundException('Object not found');
      } else if (objectData.organizationId !== user.organizationId) {
        throw new BadRequestException('Wrong orgazination');
      }

      const skip = (page - 1) * limit;

      const [items, total] = await Promise.all([
        this.prisma.monitoringLog.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { username: true },
            },
            checkpoint: {
              select: { name: true },
            },
          },
        }),

        this.prisma.monitoringLog.count(),
      ]);

      return {
        items,
        total,
        page,
        limit,
      };
    } catch (error) {
      if (error.message.includes('found'))
        throw new NotFoundException(error.message);
      throw new BadRequestException(error.message);
    }
  }

  async findAllUsers(user: any) {
    try {
      const res = await this.prisma.users.findMany({
        where: {
          organizationId: user.organizationId,
          role: {
            in: ['GUARD', 'OPERATOR'],
          },
        },
      });

      const data = res.map((item) => ({
        id: item.id,
        login: item.login,
        username: item.username,
        role: item.role,
        status: item.status,
        createdAt: item.createdAt,
      }));

      return data;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

}
