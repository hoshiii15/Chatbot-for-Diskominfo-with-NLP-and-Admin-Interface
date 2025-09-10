import { DataTypes, Model, Sequelize } from 'sequelize';

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

export interface FAQCreationAttributes extends Omit<FAQAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class FAQ extends Model<FAQAttributes, FAQCreationAttributes> implements FAQAttributes {
  public id!: string;
  public question!: string;
  public answer!: string;
  public category?: string;
  public environment!: 'stunting' | 'ppid';
  public keywords?: string[];
  public isActive!: boolean;
  public priority!: number;
  public views!: number;
  public lastUsed?: Date;
  public createdBy?: string;
  public updatedBy?: string;
  public metadata?: any;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  public incrementViews(): void {
    this.views += 1;
    this.lastUsed = new Date();
  }

  public isPopular(): boolean {
    return this.views > 100;
  }

  public getKeywordString(): string {
    return this.keywords?.join(', ') || '';
  }
}

export const initFAQModel = (sequelize: Sequelize): typeof FAQ => {
  FAQ.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      question: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          len: [1, 1000],
        },
      },
      answer: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          len: [1, 5000],
        },
      },
      category: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      environment: {
        type: DataTypes.ENUM('stunting', 'ppid'),
        allowNull: false,
      },
      keywords: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      priority: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
          max: 100,
        },
      },
      views: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      lastUsed: {
        type: DataTypes.DATE,
        allowNull: true,
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
      modelName: 'FAQ',
      tableName: 'faqs',
      timestamps: true,
      indexes: [
        {
          fields: ['environment'],
        },
        {
          fields: ['category'],
        },
        {
          fields: ['isActive'],
        },
        {
          fields: ['priority'],
        },
        {
          fields: ['views'],
        },
        {
          fields: ['environment', 'isActive'],
        },
        {
          fields: ['environment', 'category'],
        },
      ],
    }
  );

  return FAQ;
};
