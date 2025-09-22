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
      where: { username: registerAuthDto.username },
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
    const { username, password } = loginAuthDto;
    let accesToken = {};
    try {
      const data = await this.prisma.users.findUnique({
        where: { username },
      });

      if (!data) {
        throw new NotFoundException('User not found');
      } else if (data.status == 'INACTIVE') {
        throw new BadRequestException('User is inactive');
      } else if (await bcrypt.compare(password, data.password)) {
        accesToken = await this.generateAccessToken({
          id: data.id,
          username: data.username,
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
          username,
          role: data.role,
          ...accesToken,
        },
      };
    } catch (error) {
      throw new BadRequestException(error.message);
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
