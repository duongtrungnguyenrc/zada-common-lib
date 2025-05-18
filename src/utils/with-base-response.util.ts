import { ApiPropertyOptions, ApiResponseProperty } from "@nestjs/swagger";
import { IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { mixin } from "@nestjs/common";

import { TResponseVM } from "../types";

type Constructor<T = {}> = new (...args: any[]) => T;

export function withResponseVM<TBase extends Constructor>(Base: TBase, options?: ApiPropertyOptions) {
  class ResponseVM implements TResponseVM<InstanceType<TBase>> {
    @ApiResponseProperty()
    @IsString()
    message: string;

    @ApiResponseProperty({
      type: Base,
      ...options,
    })
    @Type(() => Base)
    @ValidateNested({ each: true })
    data: InstanceType<TBase>;
  }

  return mixin(ResponseVM);
}
