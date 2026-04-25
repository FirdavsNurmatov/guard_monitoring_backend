import { IsNotEmpty, IsNumber, IsString, IsOptional } from 'class-validator';

export class CheckinDto {
  @IsNotEmpty()
  @IsNumber()
  userId: number;

  @IsNotEmpty()
  @IsString()
  checkpointCardNum: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}