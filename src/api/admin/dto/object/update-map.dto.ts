import { PartialType } from '@nestjs/mapped-types';
import { CreateObjectDto } from './create-map.dto';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateObjectDto extends PartialType(CreateObjectDto) {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
