import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import { getFaqFilePath, getBackupPath } from '../utils/config';
import { logger } from '../utils/logger';
import { FAQ, FAQData, BackupFile } from '../../../shared/types';

export class FileManagerService {
  private backupPath: string;

  constructor() {
    this.backupPath = getBackupPath();
    this.ensureDirectoriesExist();
  }

  /**
   * Ensure backup directory exists
   */
  private async ensureDirectoriesExist(): Promise<void> {
    try {
      await fs.ensureDir(this.backupPath);
    } catch (error) {
      logger.error('Failed to create backup directory:', error);
    }
  }

  /**
   * Read FAQ file for a specific environment
   */
  async readFAQFile(env: 'stunting' | 'ppid'): Promise<FAQData> {
    try {
      const filePath = getFaqFilePath(env);
      
      if (!await fs.pathExists(filePath)) {
        throw new Error(`FAQ file not found: ${filePath}`);
      }

      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content) as FAQData;

      // Validate data structure
      if (!data.faqs || !Array.isArray(data.faqs)) {
        throw new Error('Invalid FAQ file structure');
      }

      return data;
    } catch (error) {
      logger.error(`Failed to read FAQ file for ${env}:`, error);
      throw new Error(`Failed to read FAQ file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Write FAQ file for a specific environment
   */
  async writeFAQFile(env: 'stunting' | 'ppid', data: FAQData): Promise<void> {
    try {
      const filePath = getFaqFilePath(env);
      
      // Validate data before writing
      this.validateFAQData(data);

      // Write file with proper formatting
      const content = JSON.stringify(data, null, 4);
      await fs.writeFile(filePath, content, 'utf-8');

      logger.info(`FAQ file updated successfully for ${env}`, {
        filePath,
        faqCount: data.faqs.length,
      });
    } catch (error) {
      logger.error(`Failed to write FAQ file for ${env}:`, error);
      throw new Error(`Failed to write FAQ file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a backup of the FAQ file
   */
  async createBackup(env: 'stunting' | 'ppid'): Promise<BackupFile> {
    try {
      const sourcePath = getFaqFilePath(env);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFilename = `faq_${env}_backup_${timestamp}.json`;
      const backupFilePath = path.join(this.backupPath, backupFilename);

      // Read source file
      const content = await fs.readFile(sourcePath, 'utf-8');
      
      // Calculate checksum
      const checksum = crypto.createHash('md5').update(content).digest('hex');
      
      // Write backup
      await fs.writeFile(backupFilePath, content, 'utf-8');
      
      // Get file stats
      const stats = await fs.stat(backupFilePath);

      const backupFile: BackupFile = {
        id: crypto.randomUUID(),
        filename: backupFilename,
        env,
        created_at: new Date().toISOString(),
        size: stats.size,
        checksum,
      };

      logger.info('Backup created successfully', {
        env,
        filename: backupFilename,
        size: stats.size,
      });

      return backupFile;
    } catch (error) {
      logger.error(`Failed to create backup for ${env}:`, error);
      throw new Error(`Failed to create backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List available backups
   */
  async listBackups(env?: 'stunting' | 'ppid'): Promise<BackupFile[]> {
    try {
      const files = await fs.readdir(this.backupPath);
      const backups: BackupFile[] = [];

      for (const file of files) {
        if (file.endsWith('.json') && file.includes('backup')) {
          const filePath = path.join(this.backupPath, file);
          const stats = await fs.stat(filePath);
          const content = await fs.readFile(filePath, 'utf-8');
          const checksum = crypto.createHash('md5').update(content).digest('hex');

          // Extract environment from filename
          const envMatch = file.match(/faq_(stunting|ppid)_backup/);
          const fileEnv = envMatch ? envMatch[1] as 'stunting' | 'ppid' : 'stunting';

          // Filter by environment if specified
          if (env && fileEnv !== env) {
            continue;
          }

          backups.push({
            id: crypto.randomUUID(),
            filename: file,
            env: fileEnv,
            created_at: stats.mtime.toISOString(),
            size: stats.size,
            checksum,
          });
        }
      }

      // Sort by creation date (newest first)
      return backups.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (error) {
      logger.error('Failed to list backups:', error);
      return [];
    }
  }

  /**
   * Restore from backup
   */
  async restoreFromBackup(backupFilename: string): Promise<void> {
    try {
      const backupFilePath = path.join(this.backupPath, backupFilename);
      
      if (!await fs.pathExists(backupFilePath)) {
        throw new Error('Backup file not found');
      }

      // Extract environment from filename
      const envMatch = backupFilename.match(/faq_(stunting|ppid)_backup/);
      if (!envMatch) {
        throw new Error('Invalid backup filename format');
      }
      
      const env = envMatch[1] as 'stunting' | 'ppid';
      const targetPath = getFaqFilePath(env);

      // Create backup of current file before restore
      await this.createBackup(env);

      // Copy backup to target location
      await fs.copy(backupFilePath, targetPath);

      logger.info('Restored from backup successfully', {
        backupFilename,
        env,
        targetPath,
      });
    } catch (error) {
      logger.error('Failed to restore from backup:', error);
      throw new Error(`Failed to restore from backup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clean old backups based on retention policy
   */
  async cleanOldBackups(retentionDays: number = 30): Promise<number> {
    try {
      const backups = await this.listBackups();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      let deletedCount = 0;

      for (const backup of backups) {
        const backupDate = new Date(backup.created_at);
        if (backupDate < cutoffDate) {
          const backupFilePath = path.join(this.backupPath, backup.filename);
          await fs.remove(backupFilePath);
          deletedCount++;
          
          logger.info('Old backup deleted', {
            filename: backup.filename,
            createdAt: backup.created_at,
          });
        }
      }

      logger.info(`Cleanup completed: ${deletedCount} old backups deleted`);
      return deletedCount;
    } catch (error) {
      logger.error('Failed to clean old backups:', error);
      return 0;
    }
  }

  /**
   * Validate FAQ data structure
   */
  private validateFAQData(data: FAQData): void {
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

  /**
   * Get file stats for monitoring
   */
  async getFileStats(): Promise<Record<string, any>> {
    try {
      const stats: Record<string, any> = {};

      for (const env of ['stunting', 'ppid'] as const) {
        const filePath = getFaqFilePath(env);
        
        if (await fs.pathExists(filePath)) {
          const fileStats = await fs.stat(filePath);
          const content = await fs.readFile(filePath, 'utf-8');
          const data = JSON.parse(content) as FAQData;

          stats[env] = {
            exists: true,
            size: fileStats.size,
            modified: fileStats.mtime.toISOString(),
            faqCount: data.faqs.length,
            questionCount: data.faqs.reduce((sum, faq) => sum + faq.questions.length, 0),
          };
        } else {
          stats[env] = {
            exists: false,
          };
        }
      }

      return stats;
    } catch (error) {
      logger.error('Failed to get file stats:', error);
      return {};
    }
  }
}
