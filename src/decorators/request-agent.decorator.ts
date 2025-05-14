import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { UAParser } from "ua-parser-js";

import { UserAgent } from "../types";

export const RequestAgent = createParamDecorator((_: unknown, ctx: ExecutionContext): UserAgent => {
  const request = ctx.switchToHttp().getRequest();
  const userAgent = request.headers["user-agent"] || "";
  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  return {
    browser: result.browser,
    os: result.os,
    device: result.device,
    ua: userAgent,
  };
});
