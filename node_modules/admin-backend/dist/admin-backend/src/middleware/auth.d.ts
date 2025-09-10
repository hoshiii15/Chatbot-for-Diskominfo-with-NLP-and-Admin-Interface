import { Request, Response, NextFunction } from 'express';
import { User } from '../../../shared/types';
declare global {
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}
export interface JWTPayload {
    id: string;
    username: string;
    email: string;
    role: string;
}
export declare const authMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const requireRole: (roles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
export declare const requireAdmin: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireEditor: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map