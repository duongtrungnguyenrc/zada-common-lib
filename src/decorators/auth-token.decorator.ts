import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { jwtDecode } from "jwt-decode";

import { extractAuthToken } from "../utils";
import { JwtPayload } from "../types";

export const AuthToken = (key?: keyof JwtPayload) => {
  return createParamDecorator(
    (_: unknown, ctx: ExecutionContext): string | undefined => {
      const request = ctx.switchToHttp().getRequest();

      try {
        return extractAuthToken(request);
      } catch (error) {
        return undefined;
      }
    }
  )();
};
