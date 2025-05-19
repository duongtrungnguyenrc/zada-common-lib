import { ApiExtraModels, ApiPropertyOptions, ApiProperty } from "@nestjs/swagger";
import { mixin } from "@nestjs/common";

import { Constructor } from "../types";
import { PagingMetaVM } from "../vms";

export function withPagingResponse<TData extends Constructor>(Data: TData, options?: ApiPropertyOptions) {
  @ApiExtraModels(Data)
  class PagingDataVM {
    @ApiProperty({ type: PagingMetaVM })
    meta: PagingMetaVM;

    @ApiProperty({
      type: () => Data,
      ...options,
    })
    data: Array<InstanceType<TData>>;
  }

  return mixin(PagingDataVM);
}
