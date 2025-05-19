import { createParamDecorator, ExecutionContext } from "@nestjs/common";

import { PageableDto } from "../dtos";

export const Pageable = createParamDecorator((_, ctx: ExecutionContext): PageableDto => {
  const request = ctx.switchToHttp().getRequest();

  const { page = 1, size = 10 } = request.query;

  return { page, size };
});
