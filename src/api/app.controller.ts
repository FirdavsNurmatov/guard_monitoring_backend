import { Controller, Get, Req } from '@nestjs/common';
import { Public } from 'src/common/guards/public.guard';

@Public()
@Controller()
export class AppController {
  // Istalgan controller ga qo'shing
  @Get('debug-ip')
  debugIp(@Req() req: any) {
    return {
      ip: req.ip,
      ips: req.ips,
      forwarded: req.headers['x-forwarded-for'],
      realIp: req.headers['x-real-ip'],
      remoteAddress: req.socket?.remoteAddress,
    };
  }

  @Get('ping')
  getPing() {
    return 'ok, working well';
  }
}
