import { Model, Sequelize } from 'sequelize';
export interface WebsiteAttributes {
    id: string;
    name: string;
    url: string;
    environment: 'stunting' | 'ppid';
    description?: string;
    isActive: boolean;
    apiKey?: string;
    settings: any;
    lastChecked?: Date;
    status: 'online' | 'offline' | 'error';
    responseTime?: number;
    createdBy?: string;
    updatedBy?: string;
    metadata?: any;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface WebsiteCreationAttributes extends Omit<WebsiteAttributes, 'id' | 'createdAt' | 'updatedAt'> {
}
export declare class Website extends Model<WebsiteAttributes, WebsiteCreationAttributes> implements WebsiteAttributes {
    id: string;
    name: string;
    url: string;
    environment: 'stunting' | 'ppid';
    description?: string;
    isActive: boolean;
    apiKey?: string;
    settings: any;
    lastChecked?: Date;
    status: 'online' | 'offline' | 'error';
    responseTime?: number;
    createdBy?: string;
    updatedBy?: string;
    metadata?: any;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    isOnline(): boolean;
    needsCheck(): boolean;
    getDisplayUrl(): string;
}
export declare const initWebsiteModel: (sequelize: Sequelize) => typeof Website;
//# sourceMappingURL=Website.d.ts.map