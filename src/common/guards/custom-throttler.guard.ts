import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { createHash } from 'crypto';
import { Request } from 'express';
import { validate as isUuid, version } from 'uuid';

function isValidDeviceId(value: unknown): value is string {
  return typeof value === 'string' && isUuid(value) && version(value) === 4;
}

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  /**
   * 🌐 Clean IP resolver (proxy safe)
   */
  private getIp(req: Request): string {
    const xff = req.headers['x-forwarded-for'];
    const realIp = req.headers['x-real-ip'];

    if (typeof xff === 'string') {
      return xff.split(',')[0].trim();
    }

    if (typeof realIp === 'string') {
      return realIp;
    }

    return req.ip || req.socket.remoteAddress || 'unknown';
  }

  /**
   * 📱 Device ID resolver
   */
  private getDeviceId(req: Request): string | null {
    const raw = req.headers['x-device-id'];

    if (typeof raw !== 'string') return null;

    if (!isValidDeviceId(raw)) return null;

    return raw;
  }

  /**
   * 🧠 User fingerprint fallback
   */
  private getFingerprint(req: Request): string {
    const userAgent = req.headers['user-agent'] ?? 'unknown';

    return createHash('sha256').update(userAgent).digest('hex').slice(0, 16);
  }

  /**
   * 🔥 MAIN TRACKER
   */
  protected async getTracker(req: Request): Promise<string> {
    const userId = (req as any).user?.id;

    // 👤 1. AUTH USER → instant return (NO EXTRA WORK)
    if (userId) {
      return `throttle:user:${userId}`;
    }

    // 📱 2. DEVICE CHECK
    const deviceId = this.getDeviceId(req);

    if (deviceId) {
      return `throttle:device:${deviceId}`;
    }

    // 🌐 3. IP (cheap)
    const ip = this.getIp(req);

    // 🧠 4. fingerprint (EXPENSIVE → last)
    const fp = this.getFingerprint(req);

    // console.log(deviceId, ip, fp);

    return `throttle:ipua:${ip}:${fp}`;
  }
}
