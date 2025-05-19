import { ApiExtraModels, ApiPropertyOptions, ApiProperty } from "@nestjs/swagger";
import { mixin } from "@nestjs/common";

import { Constructor, InfiniteData } from "../types";

export function withInfiniteResponseUtil<TData extends Constructor>(Data: TData, options?: ApiPropertyOptions) {
  @ApiExtraModels(Data)
  class PagingVM implements InfiniteData<InstanceType<TData>> {
    @ApiProperty({ type: Number })
    nextPage: number;

    @ApiProperty({
      type: () => Data,
      ...options,
    })
    data: Array<InstanceType<TData>>;
  }

  return mixin(PagingVM);
}
