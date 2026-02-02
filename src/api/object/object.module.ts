import { Module } from '@nestjs/common';
import { ObjectService } from './object.service';
import { ObjectController } from './object.controller';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../user/user.module';

@Module({
  imports: [JwtModule, UsersModule],
  controllers: [ObjectController],
  providers: [ObjectService, PrismaService],
})
export class ObjectModule {}
