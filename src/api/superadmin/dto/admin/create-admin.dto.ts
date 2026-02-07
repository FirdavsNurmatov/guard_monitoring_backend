import { IsString, IsOptional, IsEmail, IsNotEmpty } from 'class-validator';

export class CreateAdminDto {
  @IsOptional()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  login: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsOptional()
  organizationId?: number; // optional, global admin uchun bo‘sh
}
