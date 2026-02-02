import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MonitoringGateway } from '../monitoring/monitoring.gateway';
import { UsersModule } from '../user/user.module';

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        global: true,
        secret: configService.get<string>('access.accessTokenKey'),
        signOptions: {
          expiresIn: configService.get('access.accessTokenExpireTime'),
        },
      }),
    }),
  ],
  controllers: [AdminController],
  providers: [AdminService, PrismaService, MonitoringGateway],
})
export class AdminModule {}
