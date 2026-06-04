import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const forwarded = req.headers['x-forwarded-for'];
    const realIp = req.headers['x-real-ip'];

    // console.log('=== THROTTLER DEBUG ===');
    // console.log('req.ip:', req.ip);
    // console.log('x-forwarded-for:', forwarded);
    // console.log('x-real-ip:', realIp);
    // console.log('remoteAddress:', req.socket?.remoteAddress);
    // console.log('======================');

    if (forwarded) {
      const ips = forwarded.split(',').map((ip: string) => ip.trim());
      return ips[0];
    }

    if (realIp) return realIp;

    return req.ip ?? req.socket?.remoteAddress ?? 'unknown';
  }
}
