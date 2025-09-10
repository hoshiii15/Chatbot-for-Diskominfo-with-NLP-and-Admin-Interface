import { Request, Response, NextFunction } from 'express';
export interface ErrorWithStatus extends Error {
    status?: number;
    code?: string;
}
export declare const errorHandler: (err: ErrorWithStatus, req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=errorHandler.d.ts.map