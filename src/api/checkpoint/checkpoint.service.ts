import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCheckpointDto } from './dto/create-checkpoint.dto';
import { UpdateCheckpointDto } from './dto/update-checkpoint.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CheckpointService {
  constructor(private prisma: PrismaService) {}

  async createCheckpoint(user: any, dto: CreateCheckpointDto) {
    try {
      const objectData = await this.prisma.objects.findUnique({
        where: { id: dto.objectId, organizationId: user.organizationId },
      });
      if (!objectData) {
        throw new NotFoundException('Object not found');
      }

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
          throw new BadRequestException(
            'Duplicate checkpoint card number:' + dto.cardNumber,
          );
        }
      } else if (error.message.includes('found'))
        throw new NotFoundException(error.message);
      throw new BadRequestException(error.message);
    }
  }

  async findAllCheckpoints(user: any, objectId: number) {
    try {
      const objectData = await this.prisma.objects.findUnique({
        where: { id: objectId, organizationId: user.organizationId },
      });
      if (!objectData) {
        throw new NotFoundException('Object not found');
      }

      const res = await this.prisma.checkpoints.findMany({
        where: { objectId },
        orderBy: { createdAt: 'asc' },
      });

      return { res, length: res.length };
    } catch (error) {
      if (error.message.includes('found'))
        throw new NotFoundException(error.message);
      throw new BadRequestException(error.message);
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} checkpoint`;
  }

  async updateCheckpoint(user: any, id: number, dto: UpdateCheckpointDto) {
    try {
      const objectData = await this.prisma.objects.findUnique({
        where: { id: dto?.objectId, organizationId: user.organizationId },
      });
      if (!objectData) {
        throw new NotFoundException('Object not found');
      }

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
      } else if (error.message.includes('found'))
        throw new NotFoundException(error.message);
      throw new BadRequestException(error.message);
    }
  }

  async deleteCheckpoint(user: any, id: number) {
    try {
      const objectData = await this.prisma.checkpoints.findUnique({
        where: { id },
        select: { Object: true },
      });
      if (objectData?.Object.organizationId !== user.organizationId)
        throw new NotFoundException('Checkpoint not found');
      return await this.prisma.checkpoints.delete({ where: { id } });
    } catch (error) {
      if (error.message.includes('found'))
        throw new NotFoundException(error.message);
      throw new BadRequestException(error.message);
    }
  }
}
