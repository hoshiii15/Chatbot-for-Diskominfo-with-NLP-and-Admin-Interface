import { DataTypes, Model, Sequelize } from 'sequelize';

export interface AnalyticsAttributes {
  id: string;
  date: string; // YYYY-MM-DD format
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

export interface AnalyticsCreationAttributes extends Omit<AnalyticsAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Analytics extends Model<AnalyticsAttributes, AnalyticsCreationAttributes> implements AnalyticsAttributes {
  public id!: string;
  public date!: string;
  public environment!: 'stunting' | 'ppid';
  public totalQuestions!: number;
  public totalSessions!: number;
  public averageConfidence!: number;
  public averageResponseTime!: number;
  public uniqueUsers!: number;
  public popularQuestions!: any[];
  public categoryDistribution!: any[];
  public confidenceDistribution!: any[];
  public hourlyDistribution!: any[];
  public metadata?: any;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  public getFormattedDate(): string {
    return new Date(this.date).toLocaleDateString();
  }

  public getAverageQuestionsPerSession(): number {
    return this.totalSessions > 0 ? this.totalQuestions / this.totalSessions : 0;
  }

  public isHighActivity(): boolean {
    return this.totalQuestions > 100;
  }
}

export const initAnalyticsModel = (sequelize: Sequelize): typeof Analytics => {
  Analytics.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
          isDate: true,
        },
      },
      environment: {
        type: DataTypes.ENUM('stunting', 'ppid'),
        allowNull: false,
      },
      totalQuestions: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      totalSessions: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      averageConfidence: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0.0,
        validate: {
          min: 0.0,
          max: 1.0,
        },
      },
      averageResponseTime: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0.0,
        validate: {
          min: 0.0,
        },
      },
      uniqueUsers: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      popularQuestions: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
      categoryDistribution: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
      confidenceDistribution: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
      hourlyDistribution: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Analytics',
      tableName: 'analytics',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['date', 'environment'],
        },
        {
          fields: ['environment'],
        },
        {
          fields: ['date'],
        },
        {
          fields: ['totalQuestions'],
        },
      ],
    }
  );

  return Analytics;
};
