import { Model, Sequelize } from 'sequelize';
export interface ChatLogAttributes {
    id: string;
    sessionId?: string;
    question: string;
    answer: string;
    confidence: number;
    category?: string;
    environment: 'stunting' | 'ppid';
    status: 'success' | 'error' | 'no_answer';
    responseTime: number;
    userAgent?: string;
    ipAddress?: string;
    metadata?: any;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface ChatLogCreationAttributes extends Omit<ChatLogAttributes, 'id' | 'createdAt' | 'updatedAt'> {
}
export declare class ChatLog extends Model<ChatLogAttributes, ChatLogCreationAttributes> implements ChatLogAttributes {
    id: string;
    sessionId?: string;
    question: string;
    answer: string;
    confidence: number;
    category?: string;
    environment: 'stunting' | 'ppid';
    status: 'success' | 'error' | 'no_answer';
    responseTime: number;
    userAgent?: string;
    ipAddress?: string;
    metadata?: any;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    isHighConfidence(): boolean;
    getFormattedTime(): string;
}
export declare const initChatLogModel: (sequelize: Sequelize) => typeof ChatLog;
//# sourceMappingURL=ChatLog.d.ts.map