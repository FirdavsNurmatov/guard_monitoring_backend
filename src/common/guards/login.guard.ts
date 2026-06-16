import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { RateLimitService } from 'src/api/redis/rateLimit.service';
import { getClientFingerprint } from '../helper/getClientFingerprint';
import { TooManyRequestsException } from '../Exception/toomanyexception';

@Injectable()
export class LoginRateLimitGuard implements CanActivate {
  constructor(private readonly rateLimit: RateLimitService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const fp = getClientFingerprint(req);

    if (fp.deviceId) {
      const ok = await this.rateLimit.check(
        `login:device:${fp.deviceId}`,
        5,
        15,
      );

      if (!ok) {
        throw new TooManyRequestsException();
      }
    }

    const ipOk = await this.rateLimit.check(`login:ip:${fp.ip}`, 50, 15);

    if (!ipOk) {
      throw new TooManyRequestsException();
    }

    return true;
  }
}
