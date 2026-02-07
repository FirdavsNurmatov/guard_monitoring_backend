import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateSuperadminDto } from './dto/create-superadmin.dto';
import { UpdateSuperadminDto } from './dto/update-superadmin.dto';
import { CreateOrganizationDto } from './dto/organization/create-organization.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { UpdateOrganizationDto } from './dto/organization/edit-organization.dto';
import { CreateAdminDto } from './dto/admin/create-admin.dto';
import * as bcrypt from 'bcrypt';
import { UpdateAdminDto } from './dto/admin/update-admin.dto';
import { UpdateObjectDto } from '../object/dto/update-object.dto';
import { UpdateCheckpointDto } from '../checkpoint/dto/update-checkpoint.dto';
import { Prisma } from '@prisma/client';
import { CreateCheckpointDto } from '../checkpoint/dto/create-checkpoint.dto';
import { CreateObjectDto } from './dto/object/create-object.dto';

@Injectable()
export class SuperadminService {
  constructor(private prisma: PrismaService) {}

  create(createSuperadminDto: CreateSuperadminDto) {
    return 'This action adds a new superadmin';
  }

  findAll() {
    return `This action returns all superadmin`;
  }

  findOne(id: number) {
    return `This action returns a #${id} superadmin`;
  }

  update(id: number, updateSuperadminDto: UpdateSuperadminDto) {
    return `This action updates a #${id} superadmin`;
  }

  remove(id: number) {
    return `This action removes a #${id} superadmin`;
  }

  async createAdmin(createAdminDto: CreateAdminDto) {
    try {
      const { organizationId, login, username, password } = createAdminDto;

      // 🔹 Agar organizationId bo'sh bo'lsa, global admin bo'ladi
      if (!organizationId) {
        const existingGlobalAdmin = await this.prisma.users.findFirst({
          where: { organizationId: null },
        });
        if (existingGlobalAdmin) {
          throw new BadRequestException('Global admin allaqachon mavjud');
        }
      }

      // 🔹 login uniqueness tekshirish
      const existingUser = await this.prisma.users.findUnique({
        where: { login: login },
      });
      if (existingUser) {
        throw new BadRequestException(
          'Bu email bilan foydalanuvchi allaqachon mavjud',
        );
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const data = await this.prisma.users.create({
        data: {
          username,
          login,
          password: hashedPassword,
          organizationId: organizationId || null,
          role: organizationId ? 'ADMIN' : 'SUPERADMIN', // role
        },
      });

      return {
        username: data.username,
        login: data.login,
        organizationId: data.organizationId,
        role: data.role,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findAllAdmins(page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;

      const [data, total] = await this.prisma.$transaction([
        this.prisma.users.findMany({
          include: {
            organization: true,
          },
          where: {
            role: 'ADMIN', // faqat adminlarni olish
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),

        this.prisma.users.count({ where: { role: 'ADMIN' } }),
      ]);

      return {
        data,
        total,
        page,
        limit,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateAdmin(id: number, updateAdminDto: UpdateAdminDto) {
    const data: any = { ...updateAdminDto };
    if (updateAdminDto.password) {
      data.password = await bcrypt.hash(updateAdminDto.password, 10);
    }

    try {
      return this.prisma.users.update({
        where: { id },
        data,
        include: { organization: true },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Login yoki username allaqachon mavjud');
      }
      throw new NotFoundException('Admin topilmadi');
    }
  }

  async removeAdmin(id: number) {
    try {
      return await this.prisma.users.delete({ where: { id } });
    } catch (error) {
      throw new NotFoundException('Admin topilmadi');
    }
  }

  async createOrganization(createOrganizationDto: CreateOrganizationDto) {
    try {
      const data = await this.prisma.organization.findUnique({
        where: { name: createOrganizationDto.name },
      });

      if (data) throw new BadRequestException('Organization already exists');

      await this.prisma.organization.create({
        data: { name: createOrganizationDto.name },
      });

      return data;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findAllOrganizations(page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;

      const [data, total] = await this.prisma.$transaction([
        this.prisma.organization.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.organization.count(),
      ]);

      return {
        data,
        total,
        page,
        limit,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateOrganization(
    id: number,
    updateOrganizationDto: UpdateOrganizationDto,
  ) {
    try {
      const { name, status } = updateOrganizationDto;

      // agar name berilgan bo‘lsa va boshqa org bilan takrorlanayotgan bo‘lsa
      if (name) {
        const exist = await this.prisma.organization.findFirst({
          where: {
            name,
            NOT: { id }, // o‘zi bilan taqqoslamaslik
          },
        });

        if (exist) {
          throw new BadRequestException('Bunday nomli organization mavjud');
        }
      }

      return this.prisma.organization.update({
        where: { id },
        data: { name, status },
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateOrganizationStatus(id: number, status: 'ACTIVE' | 'INACTIVE') {
    try {
      return this.prisma.organization.update({
        where: { id },
        data: { status },
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async removeOrganization(id: number) {
    try {
      const data = await this.prisma.organization.delete({
        where: { id },
      });

      return data;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async createObject(
    file: Express.Multer.File | undefined,
    createObjectDto: any,
  ) {
    try {
      const { name, position, zoom, organizationId } = createObjectDto;

      const isOrganizationExist = await this.prisma.organization.findUnique({
        where: { id: +organizationId },
      });
      if (!isOrganizationExist)
        throw new NotFoundException('Organization not found');

      // 🔹 position parse qilinadi agar string bo'lsa
      const parsedPosition =
        typeof position === 'string' ? JSON.parse(position) : position;


      const data: any = {
        name,
        organizationId: +organizationId,
        position: parsedPosition ?? undefined,
        zoom: zoom != null ? Number(zoom) : null, // 🔹 bu yerda string -> number
      };

      // 🔹 Rasm URL qo‘shish
      if (file) {
        data.imageUrl = `/uploads/objects/${file.filename}`;
      }

      // 🔹 Prisma orqali yaratish
      const created = await this.prisma.objects.create({ data });
      return created;
    } catch (error) {
      if (error.message.includes('found')) throw new NotFoundException(error.message);
      throw new BadRequestException(error.message);
    }
  }

  async findAllObjects(page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;

      const [data, total] = await this.prisma.$transaction([
        this.prisma.objects.findMany({
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.objects.count(),
      ]);

      return {
        data,
        total,
        page,
        limit,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findOneObject(id: number) {
    try {
      const data = await this.prisma.objects.findUnique({
        where: { id },
        include: { checkpoints: true },
      });
      return data;
    } catch (error) {
      throw new NotFoundException('Object not found');
    }
  }

  async updateObject(id: number, dto: UpdateObjectDto) {
    try {
      const data = await this.prisma.objects.update({
        where: { id },
        data: {
          ...dto,
          position: dto.position ? { ...dto.position } : undefined,
        },
      });

      return data;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async removeObject(id: number) {
    try {
      const data = await this.prisma.objects.delete({
        where: { id },
      });

      return data;
    } catch (error) {
      throw new NotFoundException('Object not found');
    }
  }

  async createCheckpoint(dto: CreateCheckpointDto) {
    try {
      const objectData = await this.prisma.objects.findUnique({
        where: { id: dto.objectId },
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

  async updateCheckpoint(id: number, updateCheckpointDto: UpdateCheckpointDto) {
    try {
      const objectData = await this.prisma.objects.findUnique({
        where: {
          id: updateCheckpointDto?.objectId,
        },
      });
      if (!objectData) {
        throw new NotFoundException('Object not found');
      }

      const res = await this.prisma.checkpoints.update({
        where: { id },
        data: {
          ...updateCheckpointDto,
          position: updateCheckpointDto.position
            ? { ...updateCheckpointDto.position }
            : undefined,
          location: updateCheckpointDto.location
            ? { ...updateCheckpointDto.location }
            : undefined,
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
}
