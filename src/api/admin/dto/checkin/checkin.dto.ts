import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  Min,
  Max,
} from 'class-validator';

export class CheckinDto {
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @IsNotEmpty()
  @IsString()
  checkpointCardNum: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;
}
