import { DataTypes, Model, Sequelize } from 'sequelize';

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

export interface WebsiteCreationAttributes extends Omit<WebsiteAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Website extends Model<WebsiteAttributes, WebsiteCreationAttributes> implements WebsiteAttributes {
  public id!: string;
  public name!: string;
  public url!: string;
  public environment!: 'stunting' | 'ppid';
  public description?: string;
  public isActive!: boolean;
  public apiKey?: string;
  public settings!: any;
  public lastChecked?: Date;
  public status!: 'online' | 'offline' | 'error';
  public responseTime?: number;
  public createdBy?: string;
  public updatedBy?: string;
  public metadata?: any;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  public isOnline(): boolean {
    return this.status === 'online';
  }

  public needsCheck(): boolean {
    if (!this.lastChecked) return true;
    const now = new Date();
    const lastCheck = new Date(this.lastChecked);
    const diffMinutes = (now.getTime() - lastCheck.getTime()) / (1000 * 60);
    return diffMinutes > 5; // Check every 5 minutes
  }

  public getDisplayUrl(): string {
    try {
      const urlObj = new URL(this.url);
      return urlObj.hostname;
    } catch {
      return this.url;
    }
  }
}

export const initWebsiteModel = (sequelize: Sequelize): typeof Website => {
  Website.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          len: [1, 100],
        },
      },
      url: {
        type: DataTypes.STRING(500),
        allowNull: false,
        validate: {
          isUrl: true,
        },
      },
      environment: {
        type: DataTypes.ENUM('stunting', 'ppid'),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      apiKey: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      settings: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {},
      },
      lastChecked: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('online', 'offline', 'error'),
        allowNull: false,
        defaultValue: 'offline',
      },
      responseTime: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 0,
        },
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      updatedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Website',
      tableName: 'websites',
      timestamps: true,
      indexes: [
        {
          fields: ['environment'],
        },
        {
          fields: ['isActive'],
        },
        {
          fields: ['status'],
        },
        {
          fields: ['environment', 'isActive'],
        },
      ],
    }
  );

  return Website;
};
