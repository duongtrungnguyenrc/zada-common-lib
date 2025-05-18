import { ApiPropertyOptions, ApiResponseProperty } from "@nestjs/swagger";
import { ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { mixin } from "@nestjs/common";

import { Constructor, InfiniteResponse } from "../types";

export function withInfiniteResponse<TBase extends Constructor>(Base: TBase, options?: ApiPropertyOptions) {
  class PagingVM implements InfiniteResponse<InstanceType<TBase>> {
    @ApiResponseProperty()
    nextPage: number;

    @ApiResponseProperty({
      type: Base,
      ...options,
    })
    @Type(() => Base)
    @ValidateNested({ each: true })
    data: Array<InstanceType<TBase>>;
  }

  return mixin(PagingVM);
}
