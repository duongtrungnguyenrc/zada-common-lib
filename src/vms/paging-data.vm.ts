import { ApiResponseProperty } from "@nestjs/swagger";

import { PagingMeta, PagingResponse } from "../types";
import { PagingMetaVM } from "./paging-meta.vm";

export class PagingResponseVM<T = any> implements PagingResponse<T> {
  @ApiResponseProperty()
  data: T[];

  @ApiResponseProperty({ type: () => PagingMetaVM })
  meta: PagingMeta;
}
