import { IsNumber, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class PagingDto {
  @ApiProperty({ type: Number, default: 1 })
  @IsNumber()
  @IsOptional()
  page: number = 1;

  @ApiProperty({ type: Number, default: 20 })
  @IsNumber()
  @IsOptional()
  size: number = 20;
}
