import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CheckpointService {
  constructor(private prisma: PrismaService) {}

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

  async findOne(id: number) {
    try {
      const data = await this.prisma.checkpoints.findUnique({ where: { id } });
      if (!data) throw new NotFoundException('Checkpoint not found');
    } catch (error) {
      if (error.message.includes('found'))
        throw new NotFoundException(error.message);
      throw new BadRequestException(error.message);
    }
  }
}
