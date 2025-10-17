declare module 'express' {
  import * as http from 'http';
  import { ParsedUrlQuery } from 'querystring';

  type ParamsDictionary = { [key: string]: string };

  interface Request<P = ParamsDictionary, ResBody = any, ReqBody = any, ReqQuery = ParsedUrlQuery> extends http.IncomingMessage {
    params: P;
    body: ReqBody;
    query: ReqQuery;
    headers: http.IncomingHttpHeaders;
  }

  interface Response<T = any> extends http.ServerResponse {
    json: (body: T) => Response<T>;
    status: (code: number) => Response<T>;
    send: (body?: any) => Response<T>;
  }

  interface NextFunction {
    (err?: any): void;
  }

  type Router = any;

  function Router(): Router;

  const express: {
    (): any;
    json: (opts?: any) => any;
    urlencoded: (opts?: any) => any;
    static: (root: string) => any;
    Router: typeof Router;
    request: Request;
    response: Response;
  };

  export default express;
  export { Request, Response, NextFunction, Router };
}
