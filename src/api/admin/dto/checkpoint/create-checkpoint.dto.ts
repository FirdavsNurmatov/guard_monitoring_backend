import { Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  Min,
  Max,
  IsOptional,
  IsObject,
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

export class CreateCheckpointDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  normal_time?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  pass_time?: number;

  @IsNotEmpty()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => PositionDto)
  position: PositionDto;

  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  card_number: string;

  @IsOptional()
  @IsObject()
  location?: object;
}
