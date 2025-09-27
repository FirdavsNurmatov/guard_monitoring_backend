import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginAuthDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  login: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
