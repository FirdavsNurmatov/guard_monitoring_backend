import { Module } from '@nestjs/common';
import { MonitoringGateway } from './monitoring/monitoring.gateway';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import configuration from 'src/common/config/configuration';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from 'src/common/prisma/prisma.module';
import { ObjectModule } from './object/object.module';
import { CheckpointModule } from './checkpoint/checkpoint.module';
import { UsersModule } from './user/user.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      envFilePath: '../../.env',
      isGlobal: true,
      load: [configuration],
    }),
    PrismaModule,
    AuthModule,
    AdminModule,
    UsersModule,
    ObjectModule,
    CheckpointModule,
  ],
  controllers: [],
  providers: [MonitoringGateway],
})
export class AppModule {}
