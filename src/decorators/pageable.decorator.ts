import { createParamDecorator, ExecutionContext } from "@nestjs/common";

import { Pageable } from "../types";

export const Pagination = createParamDecorator(
  (_, ctx: ExecutionContext): Pageable => {
    const request = ctx.switchToHttp().getRequest();

    const { page = 1, limit = 10 } = request.query;

    return { page, limit };
  }
);
