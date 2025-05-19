import { ApiProperty } from "@nestjs/swagger";

export class PagingMetaVM {
  @ApiProperty({ type: Number, example: 1 })
  page: number;

  @ApiProperty({ type: Number, example: 20 })
  size: number;

  @ApiProperty({ type: Number, example: 10 })
  totalPages: number;
}
