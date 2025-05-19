import { createParamDecorator, ExecutionContext } from "@nestjs/common";

import { PagingDto } from "../dtos";

export const Paging = createParamDecorator((_, ctx: ExecutionContext): PagingDto => {
  const request = ctx.switchToHttp().getRequest();

  const { page = 1, size = 10 } = request.query;

  return { page, size };
});
