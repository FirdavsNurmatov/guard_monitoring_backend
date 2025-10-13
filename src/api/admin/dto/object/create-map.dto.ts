import {
  IsString,
  IsNotEmpty,
  MinLength,
  IsEnum,
  IsOptional,
  ValidateNested,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ObjectType } from 'src/common/enums';

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

  @IsNotEmpty()
  @IsEnum(ObjectType)
  type: ObjectType;

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
