import { ApiExtraModels, ApiPropertyOptions, ApiProperty } from "@nestjs/swagger";
import { mixin } from "@nestjs/common";

import { Constructor } from "../types";

export function withBaseResponse<TData extends Constructor>(Data: TData, options?: ApiPropertyOptions) {
  @ApiExtraModels(Data)
  class ResponseVM {
    @ApiProperty({ type: String })
    message: string;

    @ApiProperty({ type: Date, example: new Date() })
    timestamp?: Date;

    @ApiProperty({ type: Number })
    code?: number;

    @ApiProperty({
      type: () => Data,
      ...options,
    })
    data?: InstanceType<TData>;
  }

  return mixin(ResponseVM);
}
