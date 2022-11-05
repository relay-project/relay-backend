import {
  DataTypes,
  type Model,
  type ModelStatic,
  type Sequelize,
} from 'sequelize';

import { TABLES } from '../../configuration';

export const tableName = TABLES.messages;

export const createModel = (connection: Sequelize): ModelStatic<Model> => {
  const model = connection.define(
    tableName,
    {
      authorId: {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        references: {
          key: 'id',
          model: TABLES.users,
        },
        type: DataTypes.INTEGER,
      },
      chatId: {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        references: {
          key: 'id',
          model: TABLES.chats,
        },
        type: DataTypes.INTEGER,
      },
      edited: {
        defaultValue: false,
        type: DataTypes.BOOLEAN,
      },
      text: {
        type: DataTypes.TEXT,
      },
    },
    {
      tableName,
      timestamps: true,
    },
  );

  return model;
};
