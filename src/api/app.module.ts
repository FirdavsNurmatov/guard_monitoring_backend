import { Module } from '@nestjs/common';
import { MonitoringGateway } from './monitoring/monitoring.gateway';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { PrismaModule } from 'src/common/prisma/prisma.module';
import { ObjectModule } from './object/object.module';
import { CheckpointModule } from './checkpoint/checkpoint.module';
import { UsersModule } from './user/user.module';
import { SuperadminModule } from './superadmin/superadmin.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import configuration from 'src/common/config/configuration';
import { CustomThrottlerGuard } from 'src/common/guards/custom-throttler.guard';

@Module({
  imports: [
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
    SuperadminModule,
    ThrottlerModule.forRoot([
      {
        ttl: 10000,
        limit: 10,
      },
    ]),
  ],
  controllers: [],
  providers: [
    MonitoringGateway,
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule {}
