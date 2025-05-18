import { ApiResponseProperty } from "@nestjs/swagger";

import { InfiniteResponse } from "../types";

export class InfiniteResponseVM<T = any> implements InfiniteResponse<T> {
  @ApiResponseProperty()
  data: T[];

  @ApiResponseProperty()
  nextPage?: number;
}
