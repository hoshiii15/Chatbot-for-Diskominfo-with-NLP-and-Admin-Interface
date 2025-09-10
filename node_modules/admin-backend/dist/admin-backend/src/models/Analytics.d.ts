import { Model, Sequelize } from 'sequelize';
export interface AnalyticsAttributes {
    id: string;
    date: string;
    environment: 'stunting' | 'ppid';
    totalQuestions: number;
    totalSessions: number;
    averageConfidence: number;
    averageResponseTime: number;
    uniqueUsers: number;
    popularQuestions: any[];
    categoryDistribution: any[];
    confidenceDistribution: any[];
    hourlyDistribution: any[];
    metadata?: any;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface AnalyticsCreationAttributes extends Omit<AnalyticsAttributes, 'id' | 'createdAt' | 'updatedAt'> {
}
export declare class Analytics extends Model<AnalyticsAttributes, AnalyticsCreationAttributes> implements AnalyticsAttributes {
    id: string;
    date: string;
    environment: 'stunting' | 'ppid';
    totalQuestions: number;
    totalSessions: number;
    averageConfidence: number;
    averageResponseTime: number;
    uniqueUsers: number;
    popularQuestions: any[];
    categoryDistribution: any[];
    confidenceDistribution: any[];
    hourlyDistribution: any[];
    metadata?: any;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    getFormattedDate(): string;
    getAverageQuestionsPerSession(): number;
    isHighActivity(): boolean;
}
export declare const initAnalyticsModel: (sequelize: Sequelize) => typeof Analytics;
//# sourceMappingURL=Analytics.d.ts.map