import { ApiProperty } from "@nestjs/swagger";

import { PagingMetaVM } from "./paging-meta.vm";

export class PagingDataVM<T = any> {
  @ApiProperty({ type: Array as () => T[] })
  data: T[];

  @ApiProperty({ type: () => PagingMetaVM })
  meta: PagingMetaVM;
}
