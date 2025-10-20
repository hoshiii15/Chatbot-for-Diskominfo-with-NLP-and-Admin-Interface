declare namespace Express {
  interface Request {
    ip?: string;
    get?(name: string): string | undefined;
  }

  interface Response {
    type?(mime: string): this;
    get?(name: string): string | undefined;
  }
}
