import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RateLimitService {
  constructor(
    @Inject('REDIS')
    private readonly redis: Redis,
  ) {}

  async check(
    key: string,
    limit: number,
    ttlSeconds: number,
  ): Promise<boolean> {
    const count = Number(
      await this.redis.eval(
        `
        local current = redis.call('INCR', KEYS[1])

        if current == 1 then
          redis.call('EXPIRE', KEYS[1], ARGV[1])
        end

        return current
        `,
        1,
        key,
        ttlSeconds,
      ),
    );

    // console.log({
    //   key,
    //   count,
    //   limit,
    //   ttlSeconds,
    // });

    return count <= limit;
  }
}
