import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { UpdateGuardDto } from './dto/user/update-guard.dto';
import { CreateCheckpointDto } from './dto/checkpoint/create-checkpoint.dto';
import { CreateUserDto } from './dto/user/create-guard.dto';
import { UpdateObjectDto } from './dto/object/update-map.dto';
import { UpdateCheckpointDto } from './dto/checkpoint/update-checkpoint.dto';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async createGuard(createGuardDto: CreateUserDto) {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(createGuardDto.password, salt);

    return await this.prisma.users.create({
      data: {
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

  async findAllLogsWithQuery(options: { page: number; limit: number }) {
    try {
      const { page, limit } = options;
      const skip = (page - 1) * limit;

      // 1. Har bir checkpoint uchun oxirgi log vaqtini topamiz
      const grouped = await this.prisma.monitoringLog.groupBy({
        by: ['checkpointId'],
        _max: { createdAt: true },
      });

      // 2. Oxirgi loglarni olaymiz
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
          user: { select: { id: true, username: true } },
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

  async findAllLogs() {
    return await this.prisma.monitoringLog.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, username: true, role: true },
        },
        checkpoint: {
          select: { id: true, name: true, normal_time: true, pass_time: true },
        },
      },
    });
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
  async createObject(file: Express.Multer.File, name: string) {
    try {
      const res = await this.prisma.objects.findFirst();

      if (res) throw new BadRequestException('Object already exists!');

      const map = await this.prisma.objects.create({
        data: {
          imageUrl: `/uploads/objects/${file.filename}`,
          name,
        },
      });

      return map;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findAllObjects() {
    try {
      const map = await this.prisma.objects.findMany();

      if (!map) throw new NotFoundException(`Map not found`);
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
      data: dto,
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

      return await this.prisma.objects.delete({ where: { id } });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // Checkpoints
  async findAllCheckpoints() {
    const res = await this.prisma.checkpoints.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return { res, length: res.length };
  }

  async createCheckpoint(dto: CreateCheckpointDto) {
    try {
      const res = await this.prisma.checkpoints.create({
        data: {
          ...dto,
          position: dto.position as unknown as Prisma.InputJsonValue,
        },
      });
      return res;
    } catch (err) {
      throw new InternalServerErrorException(
        err.message || 'Failed to create checkpoint',
      );
    }
  }

  async updateCheckpoint(id: number, dto: UpdateCheckpointDto) {
    try {
      const res = await this.prisma.checkpoints.update({
        where: { id },
        data: {
          ...dto,
          position: dto.position as unknown as Prisma.InputJsonValue,
        },
      });

      return res;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async deleteCheckpoint(id: number) {
    return await this.prisma.checkpoints.delete({ where: { id } });
  }
}
