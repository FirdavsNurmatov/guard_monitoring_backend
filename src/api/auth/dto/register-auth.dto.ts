import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterAuthDto {
  // @IsNotEmpty()
  // @IsString()
  // organizationId: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  login: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  username: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
