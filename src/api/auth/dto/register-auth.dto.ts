import {  IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterAuthDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  username: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
