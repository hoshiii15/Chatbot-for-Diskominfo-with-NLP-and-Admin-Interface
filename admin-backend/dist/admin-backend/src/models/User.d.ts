import { Model, Sequelize } from 'sequelize';
export interface UserAttributes {
    id: string;
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    role: 'admin' | 'moderator' | 'user';
    isActive: boolean;
    lastLogin?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
export interface UserCreationAttributes extends Omit<UserAttributes, 'id' | 'createdAt' | 'updatedAt'> {
}
export declare class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    id: string;
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    role: 'admin' | 'moderator' | 'user';
    isActive: boolean;
    lastLogin?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    getFullName(): string;
    toJSON(): Omit<UserAttributes, 'password'>;
}
export declare const initUserModel: (sequelize: Sequelize) => typeof User;
//# sourceMappingURL=User.d.ts.map