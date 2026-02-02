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
import { Type } from 'class-transformer';

class PositionDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;
}

export class CreateObjectDto {
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
  @Min(0)
  @Max(20)
  zoom?: number;
}
