import { Model, Sequelize } from 'sequelize';
export interface FAQAttributes {
    id: string;
    question: string;
    answer: string;
    category?: string;
    environment: 'stunting' | 'ppid';
    keywords?: string[];
    isActive: boolean;
    priority: number;
    views: number;
    lastUsed?: Date;
    createdBy?: string;
    updatedBy?: string;
    metadata?: any;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface FAQCreationAttributes extends Omit<FAQAttributes, 'id' | 'createdAt' | 'updatedAt'> {
}
export declare class FAQ extends Model<FAQAttributes, FAQCreationAttributes> implements FAQAttributes {
    id: string;
    question: string;
    answer: string;
    category?: string;
    environment: 'stunting' | 'ppid';
    keywords?: string[];
    isActive: boolean;
    priority: number;
    views: number;
    lastUsed?: Date;
    createdBy?: string;
    updatedBy?: string;
    metadata?: any;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    incrementViews(): void;
    isPopular(): boolean;
    getKeywordString(): string;
}
export declare const initFAQModel: (sequelize: Sequelize) => typeof FAQ;
//# sourceMappingURL=FAQ.d.ts.map