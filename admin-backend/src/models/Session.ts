import { DataTypes, Model, Sequelize } from 'sequelize';

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

export interface SessionCreationAttributes extends Omit<SessionAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class Session extends Model<SessionAttributes, SessionCreationAttributes> implements SessionAttributes {
  public id!: string;
  public userId?: string;
  public userAgent?: string;
  public ipAddress?: string;
  public environment!: 'stunting' | 'ppid';
  public isActive!: boolean;
  public startTime!: Date;
  public endTime?: Date;
  public totalQuestions!: number;
  public averageConfidence?: number;
  public metadata?: any;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  public getDuration(): number {
    const end = this.endTime || new Date();
    return end.getTime() - this.startTime.getTime();
  }

  public getDurationInMinutes(): number {
    return Math.round(this.getDuration() / (1000 * 60));
  }

  public isLongSession(): boolean {
    return this.getDurationInMinutes() > 30;
  }
}

export const initSessionModel = (sequelize: Sequelize): typeof Session => {
  Session.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      ipAddress: {
        type: DataTypes.STRING(45), // IPv6 max length
        allowNull: true,
      },
      environment: {
        type: DataTypes.ENUM('stunting', 'ppid'),
        allowNull: false,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      startTime: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      endTime: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      totalQuestions: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      averageConfidence: {
        type: DataTypes.FLOAT,
        allowNull: true,
        validate: {
          min: 0.0,
          max: 1.0,
        },
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Session',
      tableName: 'sessions',
      timestamps: true,
      indexes: [
        {
          fields: ['userId'],
        },
        {
          fields: ['environment'],
        },
        {
          fields: ['isActive'],
        },
        {
          fields: ['startTime'],
        },
        {
          fields: ['environment', 'startTime'],
        },
      ],
    }
  );

  return Session;
};
