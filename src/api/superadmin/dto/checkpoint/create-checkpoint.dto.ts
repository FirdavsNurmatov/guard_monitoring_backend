import { Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  Min,
  Max,
  IsOptional,
  ValidateNested,
  MinLength,
  IsNotEmpty,
} from 'class-validator';

class PositionDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  xPercent: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  yPercent: number;
}

class LocationDto {
  @IsNotEmpty()
  @IsNumber()
  lat: number;

  @IsNotEmpty()
  @IsNumber()
  lng: number;
}

export class CreateCheckpointDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  objectId: number;

  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  normalTime?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  passTime?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => PositionDto)
  position?: PositionDto; // IMAGE bo‘lsa ishlatiladi

  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto; // MAP bo‘lsa ishlatiladi

  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  cardNumber: string;
}
