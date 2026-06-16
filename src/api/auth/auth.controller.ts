import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginAuthDto } from './dto/login-auth.dto';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { LoginRateLimitGuard } from 'src/common/guards/login.guard';
import { Public } from 'src/common/guards/public.guard';

@Public()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // @Post('register')
  // signUp(@Body() signUpDto: RegisterAuthDto) {
  //   return this.authService.signUp(signUpDto);
  // }

  @UseGuards(LoginRateLimitGuard)
  @Post('login')
  signIn(@Body() loginAuthdto: LoginAuthDto) {
    return this.authService.signIn(loginAuthdto);
  }

  @Post('guard')
  signInGuard(@Body() loginAuthdto: LoginAuthDto) {
    return this.authService.signInGuard(loginAuthdto);
  }
}
