import { IsNumber, IsString } from 'class-validator';

export class CheckinDto {
  @IsNumber()
  userId: number;

  @IsString()
  checkpointCardNum: string;
}
