import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UpdateObjectDto } from './dto/update-object.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class ObjectService {
  constructor(private prisma: PrismaService) {}

  async createObject(
    user: any,
    file: Express.Multer.File | undefined,
    body: { name: string; position?: any; zoom?: number },
  ) {
    try {
      const { name, position, zoom } = body;

      const data: any = {
        organizationId: user.organizationId,
        name,
        position: position ? JSON.parse(position) : undefined,
        zoom: zoom ? Number(zoom) : null,
      };

      if (file) {
        data.imageUrl = `/uploads/objects/${file.filename}`;
      }

      const created = await this.prisma.objects.create({ data });
      return created;
    } catch (error) {
      // console.error(error);
      throw new BadRequestException(error.message);
    }
  }

  async findAllObjects(user: any) {
    try {
      const map = await this.prisma.objects.findMany({
        where: { organizationId: user.organizationId },
      });

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
              location: true,
              position: true,
            },
          },
        },
      });

      if (!map) throw new NotFoundException(`Map not found`);
      return map;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateObjectById(user: any, id: number, dto: UpdateObjectDto) {
    try {
      return await this.prisma.objects.update({
        where: { id, organizationId: user.organizationId },
        data: {
          ...dto,
          position: dto.position ? { ...dto.position } : undefined,
        },
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async removeObjectById(user: any, id: number) {
    try {
      const object = await this.prisma.objects.findUnique({
        where: { id, organizationId: user.organizationId },
      });
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
}
