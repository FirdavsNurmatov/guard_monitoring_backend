import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class ObjectService {
  constructor(private prisma: PrismaService) {}

  async findAllObjects(user: any) {
    try {
      const map = await this.prisma.objects.findMany({
        where: { organizationId: user.organizationId },
      });

      if (!map) throw new NotFoundException(`Object not found`);
      return map;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  async findOneObjectById(user: any, id: number) {
    try {
      const map = await this.prisma.objects.findUnique({
        where: { id, organizationId: user.organizationId },
        select: {
          id: true,
          organizationId: true,
          imageUrl: true,
          name: true,
          position: true,
          zoom: true,
          checkpoints: {
            select: {
              id: true,
              objectId: true,
              name: true,
              normalTime: true,
              passTime: true,
              cardNumber: true,
              infoStyle: true,
              location: true,
              position: true,
            },
          },
        },
      });

      if (!map) throw new NotFoundException(`Map not found`);
      return map;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
