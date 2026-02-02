import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: number) {
    try {
      const user = await this.prisma.users.findUnique({
        where: { id },
        select: {
          id: true,
          organizationId: true,
          login: true,
          username: true,
          password: true,
          status: true,
          role: true,
        },
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user;
    } catch (error) {
      if (error.message.includes('found'))
        throw new NotFoundException(error.message);
      throw new BadRequestException(error.message);
    }
  }

  async createUser(user: any, createGuardDto: CreateUserDto) {
    try {
      const isUserExists = await this.prisma.users.findUnique({
        where: { login: createGuardDto.login },
      });
      if (isUserExists) {
        throw new BadRequestException('Login duplicate');
      }

      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(createGuardDto.password, salt);

      const ifOrganizationExists = await this.prisma.organization.findUnique({
        where: { id: user.organizationId },
      });
      if (!ifOrganizationExists) {
        throw new NotFoundException('Organization not found');
      }

      return await this.prisma.users.create({
        data: {
          organizationId: user.organizationId,
          login: createGuardDto.login,
          username: createGuardDto.username,
          password: hashedPassword,
          role: createGuardDto.role,
          status: 'ACTIVE',
        },
      });
    } catch (error) {
      if (error.message.includes('found'))
        throw new NotFoundException(error.message);
      throw new BadRequestException(error.message);
    }
  }

  async findAllGuards(user: any) {
    try {
      return await this.prisma.users.findMany({
        where: { role: 'GUARD', organizationId: user.organizationId },
        select: { id: true, username: true, status: true, createdAt: true },
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findGuardById(user: any, id: number) {
    try {
      const guard = await this.prisma.users.findFirst({
        where: { id, organizationId: user.organizationId, role: 'GUARD' },
      });
      if (!guard) throw new NotFoundException('Guard not found');
      return guard;
    } catch (error) {
      if (error.message.includes('found'))
        throw new NotFoundException(error.message);
      throw new BadRequestException(error.message);
    }
  }

  async updateUser(user: any, id: number, updateUserDto: UpdateUserDto) {
    try {
      const isUserExists = await this.prisma.users.findUnique({
        where: { login: updateUserDto.login },
      });
      if (isUserExists) {
        throw new BadRequestException('Login duplicate');
      }

      const updateData: any = { ...updateUserDto };
      const guardData = await this.prisma.users.findUnique({ where: { id } });
      if (!guardData) throw new NotFoundException('User not found');
      else if (user.organizationId !== guardData.organizationId)
        throw new BadRequestException('Wrong organization');

      if (updateUserDto.password) {
        const salt = await bcrypt.genSalt();
        updateData.password = await bcrypt.hash(updateUserDto.password, salt);
      }

      return await this.prisma.users.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      if (error.message.includes('found'))
        throw new NotFoundException(error.message);
      throw new BadRequestException(error.message);
    }
  }

  async inactiveUser(user: any, id: number) {
    try {
      return await this.prisma.users.update({
        where: { id, organizationId: user.organizationId },
        data: { status: 'INACTIVE' },
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async deleteUser(user: any, id: number) {
    try {
      return await this.prisma.users.delete({
        where: { id, organizationId: user.organizationId },
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
