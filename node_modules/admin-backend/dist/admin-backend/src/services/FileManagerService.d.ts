import { FAQData, BackupFile } from '../../../shared/types';
export declare class FileManagerService {
    private backupPath;
    constructor();
    private ensureDirectoriesExist;
    readFAQFile(env: 'stunting' | 'ppid'): Promise<FAQData>;
    writeFAQFile(env: 'stunting' | 'ppid', data: FAQData): Promise<void>;
    createBackup(env: 'stunting' | 'ppid'): Promise<BackupFile>;
    listBackups(env?: 'stunting' | 'ppid'): Promise<BackupFile[]>;
    restoreFromBackup(backupFilename: string): Promise<void>;
    cleanOldBackups(retentionDays?: number): Promise<number>;
    private validateFAQData;
    getFileStats(): Promise<Record<string, any>>;
}
//# sourceMappingURL=FileManagerService.d.ts.map