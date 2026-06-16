import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RateLimitService } from './rateLimit.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    RateLimitService,
    {
      provide: 'REDIS',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisConfig = configService.get('redis'); // or configuration().redis
        return new Redis(redisConfig);
      },
    },
  ],
  exports: [RateLimitService, 'REDIS'],
})
export class RedisModule {}
