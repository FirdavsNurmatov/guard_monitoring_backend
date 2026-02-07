import { Module } from '@nestjs/common';
import { SuperadminService } from './superadmin.service';
import { SuperadminController } from './superadmin.controller';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../user/user.module';

@Module({
  imports: [JwtModule, UsersModule],
  controllers: [SuperadminController],
  providers: [SuperadminService, PrismaService],
})
export class SuperadminModule {}
