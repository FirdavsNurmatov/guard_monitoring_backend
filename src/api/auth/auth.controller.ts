import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginAuthDto } from './dto/login-auth.dto';
import { Throttle } from '@nestjs/throttler';
import { RegisterAuthDto } from './dto/register-auth.dto';

@Throttle({ default: { limit: 10, ttl: 30000 } })
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // @Post('register')
  // signUp(@Body() signUpDto: RegisterAuthDto) {
  //   return this.authService.signUp(signUpDto);
  // }

  @Post('login')
  signIn(@Body() loginAuthdto: LoginAuthDto) {
    return this.authService.signIn(loginAuthdto);
  }

  @Post('guard')
  signInGuard(@Body() loginAuthdto: LoginAuthDto) {
    return this.authService.signInGuard(loginAuthdto);
  }
}
