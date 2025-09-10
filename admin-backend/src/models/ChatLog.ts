import { DataTypes, Model, Sequelize } from 'sequelize';

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

export interface ChatLogCreationAttributes extends Omit<ChatLogAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

export class ChatLog extends Model<ChatLogAttributes, ChatLogCreationAttributes> implements ChatLogAttributes {
  public id!: string;
  public sessionId?: string;
  public question!: string;
  public answer!: string;
  public confidence!: number;
  public category?: string;
  public environment!: 'stunting' | 'ppid';
  public status!: 'success' | 'error' | 'no_answer';
  public responseTime!: number;
  public userAgent?: string;
  public ipAddress?: string;
  public metadata?: any;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance methods
  public isHighConfidence(): boolean {
    return this.confidence >= 0.8;
  }

  public getFormattedTime(): string {
    return this.createdAt.toLocaleString();
  }
}

export const initChatLogModel = (sequelize: Sequelize): typeof ChatLog => {
  ChatLog.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      sessionId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'sessions',
          key: 'id',
        },
      },
      question: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          len: [1, 5000],
        },
      },
      answer: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          len: [1, 10000],
        },
      },
      confidence: {
        type: DataTypes.FLOAT,
        allowNull: false,
        validate: {
          min: 0.0,
          max: 1.0,
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
      status: {
        type: DataTypes.ENUM('success', 'error', 'no_answer'),
        allowNull: false,
        defaultValue: 'success',
      },
      responseTime: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      ipAddress: {
        type: DataTypes.STRING(45), // IPv6 max length
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'ChatLog',
      tableName: 'chat_logs',
      timestamps: true,
      indexes: [
        {
          fields: ['sessionId'],
        },
        {
          fields: ['environment'],
        },
        {
          fields: ['status'],
        },
        {
          fields: ['confidence'],
        },
        {
          fields: ['category'],
        },
        {
          fields: ['createdAt'],
        },
        {
          fields: ['environment', 'createdAt'],
        },
      ],
    }
  );

  return ChatLog;
};
