import 'express-serve-static-core';

declare module 'express-serve-static-core' {
  interface Request {
    ip?: string;
    get?(name: string): string | undefined;
  }

  interface Response {
    type?(mime: string): this;
    get?(name: string): string | undefined;
  }
}
