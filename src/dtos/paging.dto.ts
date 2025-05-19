import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional } from "class-validator";

export class PageableDto {
  @ApiProperty()
  @IsNumber()
  @IsOptional()
  page: number = 1;

  @ApiProperty()
  @IsNumber()
  @IsOptional()
  size: number = 20;
}
