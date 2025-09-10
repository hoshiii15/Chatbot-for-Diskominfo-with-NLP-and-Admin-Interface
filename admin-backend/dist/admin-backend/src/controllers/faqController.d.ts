import { Request, Response } from 'express';
interface FileFAQ {
    id?: number | string;
    fileId?: number | string;
    questions?: string[];
    question?: string;
    answer?: string;
    category?: string | null | undefined;
    links?: any;
    environment?: 'stunting' | 'ppid';
}
export declare function loadFaqsFromFiles(): Promise<FileFAQ[]>;
export declare function readFileFaqs(env: 'stunting' | 'ppid'): Promise<FileFAQ[]>;
export declare function writeFileFaqs(env: 'stunting' | 'ppid', faqs: FileFAQ[]): Promise<boolean>;
export declare function getFaqsByEnv(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getFaqs(req: Request, res: Response): Promise<void>;
export declare function createFaq(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateFaq(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function deleteFaq(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getCategories(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function debugFiles(req: Request, res: Response): Promise<void>;
export declare function fileFaqsDebug(req: Request, res: Response): Promise<void>;
export {};
//# sourceMappingURL=faqController.d.ts.map