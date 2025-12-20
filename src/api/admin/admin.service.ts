import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { UpdateGuardDto } from './dto/user/update-guard.dto';
import { CreateCheckpointDto } from './dto/checkpoint/create-checkpoint.dto';
import { CreateUserDto } from './dto/user/create-guard.dto';
import { UpdateObjectDto } from './dto/object/update-map.dto';
import { UpdateCheckpointDto } from './dto/checkpoint/update-checkpoint.dto';
import { CheckpointStatus, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import { Cron, CronExpression } from '@nestjs/schedule';
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

      this.gateway.sendGps(`gps:${userData.userId}`);

      return gpsLog;
    } catch (error) {
      if (error.message.includes('found'))
        throw new NotFoundException(error.message);
      else if (error.message == 'Forbidden')
        throw new ForbiddenException(error.message);
      throw new BadRequestException('Something went wrong');
    }
  }

  async findLatest(userId: number, limit = 50) {
    try {
      return await this.prisma.gpsLog.findMany({
        where: { userId },
        select: { userId: true, location: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch (error) {
      throw new BadRequestException('Something went wrong');
    }
  }

  // @Cron(CronExpression.EVERY_5_SECONDS)
  // async checkGuardStatus() {
  //   try {
  //     const checkpoints = await this.prisma.checkpoints.findMany({
  //       include: {
  //         MonitoringLog: {
  //           orderBy: { createdAt: 'desc' },
  //           take: 1,
  //         },
  //       },
  //     });

  //     const now = new Date();

  //     for (const checkpoint of checkpoints) {
  //       const lastLog = checkpoint.MonitoringLog[0];

  //       if (!lastLog || lastLog.status == 'MISSED') continue;

  //       const diffMinutes = Math.floor(
  //         (now.getTime() - lastLog.createdAt.getTime()) / (1000 * 60) + 0.02,
  //       );

  //       let status: 'ON_TIME' | 'LATE' | 'MISSED' = 'ON_TIME';

  //       if (diffMinutes >= checkpoint.pass_time && lastLog.status == 'LATE') {
  //         status = 'MISSED';
  //       } else if (diffMinutes >= checkpoint.normal_time) {
  //         status = 'LATE';
  //       }

  //       if (status !== 'ON_TIME' && lastLog.status !== status) {
  //         const res = await this.prisma.monitoringLog.create({
  //           data: {
  //             status,
  //             checkpointId: checkpoint.id,
  //             userId: lastLog.userId,
  //           },
  //           include: {
  //             user: { select: { id: true, login: true, username: true } },
  //             checkpoint: {
  //               select: {
  //                 objectId: true,
  //                 id: true,
  //                 name: true,
  //                 position: true,
  //               },
  //             },
  //           },
  //         });
  //         this.gateway.sendLog(res);
  //       }

  //       console.log(
  //         `[${new Date().toLocaleTimeString('uz-UZ')}]`,
  //         'Checkpoint:',
  //         checkpoint.name,
  //         '| Diff:',
  //         diffMinutes,
  //         '| Normal:',
  //         checkpoint.normal_time,
  //         '| Pass:',
  //         checkpoint.pass_time,
  //         '| Status:',
  //         lastLog.status,
  //       );
  //     }
  //   } catch (error) {
  //     throw new BadRequestException(error.message);
  //   }
  // }

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
      where: { card_number: checkpointCardNum },
      include: {
        MonitoringLog: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!checkpoint) {
      throw new BadRequestException('Checkpoint does not exist');
    }

    const lastLog = checkpoint.MonitoringLog[0];
    let status: 'ON_TIME' | 'LATE' | 'MISSED' = 'ON_TIME';

    if (lastLog) {
      const diffMinutes = Math.floor(
        (new Date().getTime() - lastLog.createdAt.getTime()) / (1000 * 60),
      );

      if (diffMinutes >= checkpoint.normal_time) {
        status = 'LATE';

        if (diffMinutes >= checkpoint.normal_time + checkpoint.pass_time) {
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
        user: { select: { id: true, login: true, username: true } },
        checkpoint: {
          select: { objectId: true, id: true, name: true, position: true },
        },
      },
    });

    this.gateway.sendLog(res);

    console.log(
      `[${new Date().toLocaleTimeString('uz-UZ')}] Checkpoint:`,
      checkpoint.name,
      '| Status:',
      status,
    );

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

  async createGuard(createGuardDto: CreateUserDto) {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(createGuardDto.password, salt);

    return await this.prisma.users.create({
      data: {
        login: createGuardDto.login,
        username: createGuardDto.username,
        password: hashedPassword,
        role: 'GUARD',
        status: 'ACTIVE',
      },
    });
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
    objectId: number;
    page: number;
    limit: number;
  }) {
    try {
      const { objectId, page, limit } = options;
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
      throw new BadRequestException(error.message);
    }
  }

  async findAllLogs(page: number, limit: number) {
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
  }

  async findAllUsers() {
    try {
      const res = await this.prisma.users.findMany({
        where: {
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

  async findAllGuards() {
    return await this.prisma.users.findMany({
      where: { role: 'GUARD' },
      select: { id: true, username: true, status: true, createdAt: true },
    });
  }

  async findGuardById(id: number) {
    const guard = await this.prisma.users.findFirst({
      where: { id, role: 'GUARD' },
    });
    if (!guard) throw new NotFoundException('Guard not found');
    return guard;
  }

  async updateGuard(id: number, updateGuardDto: UpdateGuardDto) {
    const updateData: any = { ...updateGuardDto };

    if (updateGuardDto.password) {
      const salt = await bcrypt.genSalt();
      updateData.password = await bcrypt.hash(updateGuardDto.password, salt);
    }

    return await this.prisma.users.update({
      where: { id },
      data: updateData,
    });
  }

  async removeGuard(id: number) {
    return await this.prisma.users.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
  }

  // Objects
  async createObject(
    file: Express.Multer.File | undefined,
    body: { name: string; type: string; position?: any; zoom?: number },
  ) {
    try {
      const { name, type, position, zoom } = body;

      const data: any = {
        name,
        type,
        position: position ? JSON.parse(position) : undefined,
        zoom: zoom ? Number(zoom) : null,
      };

      // 🔹 faqat IMAGE bo‘lsa faylni saqlaymiz
      if (file && type === 'IMAGE') {
        data.imageUrl = `/uploads/objects/${file.filename}`;
      }

      const created = await this.prisma.objects.create({ data });
      return created;
    } catch (error) {
      console.error(error);
      throw new BadRequestException(error.message);
    }
  }

  async findAllObjects() {
    try {
      const map = await this.prisma.objects.findMany();

      if (!map) throw new NotFoundException(`Object not found`);
      return map;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findFirstObject() {
    try {
      const map = await this.prisma.objects.findFirst();

      return map;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findOneObjectById(id: number) {
    try {
      const map = await this.prisma.objects.findUnique({ where: { id } });

      if (!map) throw new NotFoundException(`Map not found`);
      return map;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateObjectById(id: number, dto: UpdateObjectDto) {
    return await this.prisma.objects.update({
      where: { id },
      data: {
        ...dto,
        position: dto.position ? { ...dto.position } : undefined,
      },
    });
  }

  async removeObjectById(id: number) {
    try {
      const object = await this.prisma.objects.findUnique({ where: { id } });
      if (!object) throw new Error('Object not found');

      if (object.imageUrl) {
        const filePath = path.join(
          __dirname,
          '..',
          '..',
          '..',
          '..',
          object.imageUrl,
        );
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      // await this.prisma.monitoringLog.deleteMany();
      await this.prisma.checkpoints.deleteMany();

      return await this.prisma.objects.delete({ where: { id } });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Checkpoints
  async findAllCheckpoints(objectId?: number) {
    try {
      const res = await this.prisma.checkpoints.findMany({
        where: objectId ? { objectId } : undefined,
        orderBy: { createdAt: 'asc' },
      });

      return { res, length: res.length };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async createCheckpoint(dto: CreateCheckpointDto) {
    try {
      const res = await this.prisma.checkpoints.create({
        data: {
          ...dto,
          position: dto.position as unknown as Prisma.InputJsonValue,
          location: dto.location as unknown as Prisma.InputJsonValue,
        },
      });
      return res;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException('Duplicate checkpoint card number');
        }
      }
      throw new BadRequestException(error.message);
    }
  }

  async updateCheckpoint(id: number, dto: UpdateCheckpointDto) {
    try {
      const res = await this.prisma.checkpoints.update({
        where: { id },
        data: {
          ...dto,
          position: dto.position ? { ...dto.position } : undefined,
          location: dto.location ? { ...dto.location } : undefined,
        },
      });

      return res;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException('Duplicate checkpoint card number');
        }
        if (error.code === 'P2025') {
          throw new NotFoundException(`Checkpoint with id ${id} not found`);
        }
      }
      throw new BadRequestException(error.message);
    }
  }

  async deleteCheckpoint(id: number) {
    return await this.prisma.checkpoints.delete({ where: { id } });
  }
}
