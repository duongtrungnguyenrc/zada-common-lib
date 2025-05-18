import { ApiPropertyOptions, ApiResponseProperty } from "@nestjs/swagger";
import { ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { mixin } from "@nestjs/common";

import { Constructor, TPagingDataVm, TPagingMetaVM } from "../types";

class PagingMetaVM implements TPagingMetaVM {
  @ApiResponseProperty()
  page: number;

  @ApiResponseProperty()
  size: number;

  @ApiResponseProperty()
  hasNextPage: boolean;
}

export function withPagingDataVM<TBase extends Constructor>(Base: TBase, options?: ApiPropertyOptions) {
  class PagingVM implements TPagingDataVm<InstanceType<TBase>> {
    @ApiResponseProperty({ type: PagingMetaVM })
    meta: PagingMetaVM;

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
