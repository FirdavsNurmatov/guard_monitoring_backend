import {
  IsString,
  IsNotEmpty,
  MinLength,
  IsOptional,
  ValidateNested,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

class PositionDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;
}

export class CreateObjectDto {
  @IsNotEmpty()
  @IsNumber()
  @Transform(({ value }) => Number(value)) // 🔹 string -> number
  organizationId: number;

  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PositionDto)
  position?: PositionDto;

  @IsOptional()
  @IsNumber()
  zoom?: number;
}
