"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileManagerService = void 0;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const config_1 = require("../utils/config");
const logger_1 = require("../utils/logger");
class FileManagerService {
    constructor() {
        this.backupPath = (0, config_1.getBackupPath)();
        this.ensureDirectoriesExist();
    }
    async ensureDirectoriesExist() {
        try {
            await fs_extra_1.default.ensureDir(this.backupPath);
        }
        catch (error) {
            logger_1.logger.error('Failed to create backup directory:', error);
        }
    }
    async readFAQFile(env) {
        try {
            const filePath = (0, config_1.getFaqFilePath)(env);
            if (!await fs_extra_1.default.pathExists(filePath)) {
                throw new Error(`FAQ file not found: ${filePath}`);
            }
            const content = await fs_extra_1.default.readFile(filePath, 'utf-8');
            const data = JSON.parse(content);
            if (!data.faqs || !Array.isArray(data.faqs)) {
                throw new Error('Invalid FAQ file structure');
            }
            return data;
        }
        catch (error) {
            logger_1.logger.error(`Failed to read FAQ file for ${env}:`, error);
            throw new Error(`Failed to read FAQ file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async writeFAQFile(env, data) {
        try {
            const filePath = (0, config_1.getFaqFilePath)(env);
            this.validateFAQData(data);
            const content = JSON.stringify(data, null, 4);
            await fs_extra_1.default.writeFile(filePath, content, 'utf-8');
            logger_1.logger.info(`FAQ file updated successfully for ${env}`, {
                filePath,
                faqCount: data.faqs.length,
            });
        }
        catch (error) {
            logger_1.logger.error(`Failed to write FAQ file for ${env}:`, error);
            throw new Error(`Failed to write FAQ file: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async createBackup(env) {
        try {
            const sourcePath = (0, config_1.getFaqFilePath)(env);
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupFilename = `faq_${env}_backup_${timestamp}.json`;
            const backupFilePath = path_1.default.join(this.backupPath, backupFilename);
            const content = await fs_extra_1.default.readFile(sourcePath, 'utf-8');
            const checksum = crypto_1.default.createHash('md5').update(content).digest('hex');
            await fs_extra_1.default.writeFile(backupFilePath, content, 'utf-8');
            const stats = await fs_extra_1.default.stat(backupFilePath);
            const backupFile = {
                id: crypto_1.default.randomUUID(),
                filename: backupFilename,
                env,
                created_at: new Date().toISOString(),
                size: stats.size,
                checksum,
            };
            logger_1.logger.info('Backup created successfully', {
                env,
                filename: backupFilename,
                size: stats.size,
            });
            return backupFile;
        }
        catch (error) {
            logger_1.logger.error(`Failed to create backup for ${env}:`, error);
            throw new Error(`Failed to create backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async listBackups(env) {
        try {
            const files = await fs_extra_1.default.readdir(this.backupPath);
            const backups = [];
            for (const file of files) {
                if (file.endsWith('.json') && file.includes('backup')) {
                    const filePath = path_1.default.join(this.backupPath, file);
                    const stats = await fs_extra_1.default.stat(filePath);
                    const content = await fs_extra_1.default.readFile(filePath, 'utf-8');
                    const checksum = crypto_1.default.createHash('md5').update(content).digest('hex');
                    const envMatch = file.match(/faq_(stunting|ppid)_backup/);
                    const fileEnv = envMatch ? envMatch[1] : 'stunting';
                    if (env && fileEnv !== env) {
                        continue;
                    }
                    backups.push({
                        id: crypto_1.default.randomUUID(),
                        filename: file,
                        env: fileEnv,
                        created_at: stats.mtime.toISOString(),
                        size: stats.size,
                        checksum,
                    });
                }
            }
            return backups.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        }
        catch (error) {
            logger_1.logger.error('Failed to list backups:', error);
            return [];
        }
    }
    async restoreFromBackup(backupFilename) {
        try {
            const backupFilePath = path_1.default.join(this.backupPath, backupFilename);
            if (!await fs_extra_1.default.pathExists(backupFilePath)) {
                throw new Error('Backup file not found');
            }
            const envMatch = backupFilename.match(/faq_(stunting|ppid)_backup/);
            if (!envMatch) {
                throw new Error('Invalid backup filename format');
            }
            const env = envMatch[1];
            const targetPath = (0, config_1.getFaqFilePath)(env);
            await this.createBackup(env);
            await fs_extra_1.default.copy(backupFilePath, targetPath);
            logger_1.logger.info('Restored from backup successfully', {
                backupFilename,
                env,
                targetPath,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to restore from backup:', error);
            throw new Error(`Failed to restore from backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async cleanOldBackups(retentionDays = 30) {
        try {
            const backups = await this.listBackups();
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
            let deletedCount = 0;
            for (const backup of backups) {
                const backupDate = new Date(backup.created_at);
                if (backupDate < cutoffDate) {
                    const backupFilePath = path_1.default.join(this.backupPath, backup.filename);
                    await fs_extra_1.default.remove(backupFilePath);
                    deletedCount++;
                    logger_1.logger.info('Old backup deleted', {
                        filename: backup.filename,
                        createdAt: backup.created_at,
                    });
                }
            }
            logger_1.logger.info(`Cleanup completed: ${deletedCount} old backups deleted`);
            return deletedCount;
        }
        catch (error) {
            logger_1.logger.error('Failed to clean old backups:', error);
            return 0;
        }
    }
    validateFAQData(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid FAQ data: must be an object');
        }
        if (!data.faqs || !Array.isArray(data.faqs)) {
            throw new Error('Invalid FAQ data: faqs must be an array');
        }
        for (const [index, faq] of data.faqs.entries()) {
            if (!faq || typeof faq !== 'object') {
                throw new Error(`Invalid FAQ at index ${index}: must be an object`);
            }
            if (typeof faq.id !== 'number') {
                throw new Error(`Invalid FAQ at index ${index}: id must be a number`);
            }
            if (!Array.isArray(faq.questions) || faq.questions.length === 0) {
                throw new Error(`Invalid FAQ at index ${index}: questions must be a non-empty array`);
            }
            if (typeof faq.answer !== 'string' || faq.answer.trim().length === 0) {
                throw new Error(`Invalid FAQ at index ${index}: answer must be a non-empty string`);
            }
            if (typeof faq.category !== 'string' || faq.category.trim().length === 0) {
                throw new Error(`Invalid FAQ at index ${index}: category must be a non-empty string`);
            }
        }
    }
    async getFileStats() {
        try {
            const stats = {};
            for (const env of ['stunting', 'ppid']) {
                const filePath = (0, config_1.getFaqFilePath)(env);
                if (await fs_extra_1.default.pathExists(filePath)) {
                    const fileStats = await fs_extra_1.default.stat(filePath);
                    const content = await fs_extra_1.default.readFile(filePath, 'utf-8');
                    const data = JSON.parse(content);
                    stats[env] = {
                        exists: true,
                        size: fileStats.size,
                        modified: fileStats.mtime.toISOString(),
                        faqCount: data.faqs.length,
                        questionCount: data.faqs.reduce((sum, faq) => sum + faq.questions.length, 0),
                    };
                }
                else {
                    stats[env] = {
                        exists: false,
                    };
                }
            }
            return stats;
        }
        catch (error) {
            logger_1.logger.error('Failed to get file stats:', error);
            return {};
        }
    }
}
exports.FileManagerService = FileManagerService;
//# sourceMappingURL=FileManagerService.js.map