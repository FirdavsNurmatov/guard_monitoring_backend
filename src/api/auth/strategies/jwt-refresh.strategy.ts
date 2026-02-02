import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TokenPayload } from '../token-payload.interface';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => request.cookies?.refreshToken,
      ]),
      secretOrKey: configService.get('refresh.refreshTokenKey') as string,
      passReqToCallback: true,
    });
  }

  validate(request: Request, payload: TokenPayload) {
    return this.authService.verifyUserRefreshToken(
      request.cookies?.refreshToken,
      payload.id,
    );
  }
}
