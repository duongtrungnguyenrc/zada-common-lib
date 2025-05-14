import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { jwtDecode } from "jwt-decode";

import { extractAuthToken } from "../utils";
import { JwtPayload } from "../types";

export const AuthTokenPayload = (key?: keyof JwtPayload) => {
  return createParamDecorator(
    (_: unknown, ctx: ExecutionContext): string | number | JwtPayload => {
      const request = ctx.switchToHttp().getRequest();

      try {
        const token = extractAuthToken(request);

        if (!token) return undefined;

        const decodedToken: JwtPayload = jwtDecode<JwtPayload>(token);

        if (key) return decodedToken?.[key];

        return decodedToken;
      } catch (error) {
        return undefined;
      }
    }
  )();
};
