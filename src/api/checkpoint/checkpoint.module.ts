import { Module } from '@nestjs/common';
import { CheckpointService } from './checkpoint.service';
import { CheckpointController } from './checkpoint.controller';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { UsersModule } from '../user/user.module';

@Module({
  imports: [UsersModule],
  controllers: [CheckpointController],
  providers: [CheckpointService, PrismaService],
})
export class CheckpointModule {}
