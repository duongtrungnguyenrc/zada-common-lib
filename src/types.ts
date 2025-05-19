export type UserAgent = {
  browser: { name?: string; version?: string };
  os: { name?: string; version?: string };
  device: { model?: string; type?: string; vendor?: string };
  ua: string;
};

export type JwtPayloadContent = {
  sub: string;
  jit: string;
};

export type JwtPayload = JwtPayloadContent & {
  exp: number;
  iat: number;
};

export type Constructor<T = {}> = new (...args: any[]) => T;
