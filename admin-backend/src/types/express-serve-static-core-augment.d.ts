import type { User } from '../../../shared/types';

declare module 'express-serve-static-core' {
  interface Request {
    user?: User;
    ip?: string;
    get?(name: string): string | undefined;
  }

  interface Response {
    type?(mime: string): this;
    get?(name: string): string | undefined;
  }
}

export {};
