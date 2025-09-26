import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MonitoringGateway } from '../monitoring/monitoring.gateway';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        global: true,
        secret: configService.get<string>('accessToken.accessTokenKey'),
        signOptions: {
          expiresIn: configService.get<string>(
            'accessToken.accessTokenExpireTime',
          ),
        },
      }),
    }),
  ],
  controllers: [AdminController],
  providers: [AdminService, PrismaService, MonitoringGateway],
})
export class AdminModule {}
