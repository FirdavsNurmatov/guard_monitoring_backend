import {
  IsInt,
  IsNumber,
  IsObject,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class LocationDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;
}

export class CreateGpsLogDto {
  @IsInt()
  @Min(1)
  userId: number;

  @IsObject()
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;
}
