import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class CreateObjectDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  name: string;
}
