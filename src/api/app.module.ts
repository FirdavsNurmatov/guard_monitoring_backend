import { Module } from '@nestjs/common';
import { EventsGateway } from './events/events.gateway';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import configuration from 'src/common/config/configuration';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from 'src/common/prisma/prisma.module';

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
  ],
  controllers: [],
  providers: [EventsGateway],
})
export class AppModule {}
