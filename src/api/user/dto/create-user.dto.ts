import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Role } from 'src/common/enums';

export class CreateUserDto {
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
  @MinLength(4)
  password: string;

  @IsNotEmpty()
  @IsEnum(Role)
  role: Role;
}
