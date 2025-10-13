import { PartialType } from '@nestjs/mapped-types';
import { CreateObjectDto } from './create-map.dto';
import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class PositionDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;
}

export class UpdateObjectDto extends PartialType(CreateObjectDto) {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PositionDto)
  position?: PositionDto;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(20)
  zoom?: number;
}
