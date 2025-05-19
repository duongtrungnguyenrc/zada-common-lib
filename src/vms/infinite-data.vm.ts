import { ApiProperty } from "@nestjs/swagger";

export class InfiniteDataVM<T = any> {
  @ApiProperty({ type: Array as () => T[] })
  data: T[];

  @ApiProperty({ type: Number, example: 2 })
  nextPage?: number;
}
