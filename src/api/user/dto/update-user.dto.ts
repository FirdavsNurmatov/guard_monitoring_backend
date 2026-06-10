import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from 'src/common/enums';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsString()
  @MinLength(2)
  login?: string;
  
  @IsOptional()
  @IsString()
  @MinLength(2)
  username?: string;

  @IsOptional()
  @IsString()
  // @MinLength(4)
  password?: string;

  @IsOptional()
  @IsIn([Role.OPERATOR, Role.GUARD])
  role?: Role;

  @IsOptional()
  @IsString()
  @IsIn(['INACTIVE', 'ACTIVE'])
  status?: string; // ACTIVE | INACTIVE
}
