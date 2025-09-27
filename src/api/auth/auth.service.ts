import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LoginAuthDto } from './dto/login-auth.dto';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterAuthDto } from './dto/register-auth.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async signUp(registerAuthDto: RegisterAuthDto) {
    const ifUserExists = await this.prisma.users.findUnique({
      where: { login: registerAuthDto.login },
    });

    if (ifUserExists) {
      throw new BadRequestException('User already exists');
    }

    try {
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(registerAuthDto.password, salt);

      const data = { ...registerAuthDto, password: hashedPassword };

      const user = await this.prisma.users.create({ data });

      const { password, ...result } = user;
      return {
        status_code: 201,
        message: 'User created',
        data: result,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async signIn(loginAuthDto: LoginAuthDto) {
    const { login, password } = loginAuthDto;
    let accesToken = {};
    try {
      const data = await this.prisma.users.findUnique({
        where: { login },
      });

      if (!data) {
        throw new NotFoundException('User not found');
      } else if (data.status == 'INACTIVE') {
        throw new BadRequestException('User is inactive');
      } else if (await bcrypt.compare(password, data.password)) {
        accesToken = await this.generateAccessToken({
          id: data.id,
          login: data.login,
          role: data.role,
          status: data.status,
        });
      } else {
        throw new NotFoundException('username or password incorrect!');
      }

      return {
        status_code: 200,
        message: 'Successfully logged in',
        data: {
          login,
          role: data.role,
          ...accesToken,
        },
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async signInGuard(loginAuthDto: LoginAuthDto) {
    try {
      const { login, password } = loginAuthDto;

      const data = await this.prisma.users.findUnique({
        where: { login },
      });

      if (!data) throw new NotFoundException('Guard not found');

      if (data.status == 'INACTIVE') {
        throw new BadRequestException('Guard is inactive');
      } else if (!(await bcrypt.compare(password, data.password))) {
        throw new NotFoundException('login or password incorrect');
      }

      return {
        status: 'success',
        id: data.id,
        login: data.login,
        username: data.username,
        // guardStatus: data.status,
      };
    } catch (error) {
      if (error.message != 'Guard not found')
        throw new BadRequestException(error.message);
      throw new NotFoundException(error.message);
    }
  }

  async generateAccessToken(payload: any): Promise<object> {
    const accessTokenExpireTime = this.configService.get<string>(
      'access.accessTokenExpireTime',
    );

    const res = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('access.accessTokenKey'),
      expiresIn: accessTokenExpireTime,
    });

    return {
      access_token: res,
      access_token_expire_time: accessTokenExpireTime,
    };
  }
}
