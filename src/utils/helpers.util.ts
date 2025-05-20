import { Request } from "express";

export const joinCacheKey = (...keys: string[]) => {
  return [...keys].filter((key) => !!key).join("_");
};

export const extractAuthToken = (request: Request): string | undefined => {
  const token = request.headers["authorization"];

  const [, jwtToken] = token?.split(" ");

  return jwtToken;
};
