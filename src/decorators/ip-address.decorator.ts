import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const IpAddress = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();

    const ip =
      request.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      request.socket?.remoteAddress ||
      request.ip;

    return ip;
  }
);
