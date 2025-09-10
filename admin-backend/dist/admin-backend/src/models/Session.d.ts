import { Model, Sequelize } from 'sequelize';
export interface SessionAttributes {
    id: string;
    userId?: string;
    userAgent?: string;
    ipAddress?: string;
    environment: 'stunting' | 'ppid';
    isActive: boolean;
    startTime: Date;
    endTime?: Date;
    totalQuestions: number;
    averageConfidence?: number;
    metadata?: any;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface SessionCreationAttributes extends Omit<SessionAttributes, 'id' | 'createdAt' | 'updatedAt'> {
}
export declare class Session extends Model<SessionAttributes, SessionCreationAttributes> implements SessionAttributes {
    id: string;
    userId?: string;
    userAgent?: string;
    ipAddress?: string;
    environment: 'stunting' | 'ppid';
    isActive: boolean;
    startTime: Date;
    endTime?: Date;
    totalQuestions: number;
    averageConfidence?: number;
    metadata?: any;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    getDuration(): number;
    getDurationInMinutes(): number;
    isLongSession(): boolean;
}
export declare const initSessionModel: (sequelize: Sequelize) => typeof Session;
//# sourceMappingURL=Session.d.ts.map