import { ApiExtraModels, ApiPropertyOptions, ApiProperty } from "@nestjs/swagger";
import { mixin } from "@nestjs/common";

import { Constructor } from "../types";

export function withInfiniteData<TData extends Constructor>(Data: TData, options?: ApiPropertyOptions) {
  @ApiExtraModels(Data)
  class InfiniteDataVM {
    @ApiProperty({ type: Number })
    nextPage: number;

    @ApiProperty({
      type: () => [Data],
      ...options,
    })
    data: Array<InstanceType<TData>>;
  }

  return mixin(InfiniteDataVM);
}
