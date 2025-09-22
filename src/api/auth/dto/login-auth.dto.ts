import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginAuthDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  username: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
