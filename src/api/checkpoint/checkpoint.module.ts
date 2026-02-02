import { Module } from '@nestjs/common';
import { CheckpointService } from './checkpoint.service';
import { CheckpointController } from './checkpoint.controller';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../user/user.module';

@Module({
  imports: [JwtModule, UsersModule],
  controllers: [CheckpointController],
  providers: [CheckpointService, PrismaService],
})
export class CheckpointModule {}
