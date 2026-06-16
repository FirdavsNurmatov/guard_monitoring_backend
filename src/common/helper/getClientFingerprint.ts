import { Request } from 'express';

export function getClientFingerprint(req: Request) {
  const deviceId = req.headers['x-device-id'];
  const userAgent = req.headers['user-agent'] ?? 'unknown';

  const ip = req.ip || req.socket.remoteAddress || 'unknown';

  return {
    ip,
    deviceId,
    userAgent,
  };
}
