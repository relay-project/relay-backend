import {
  DataTypes,
  type Model,
  type ModelStatic,
  type Sequelize,
} from 'sequelize';

import { TABLES } from '../../configuration';

export const tableName = TABLES.chatInvitations;

export const createModel = (connection: Sequelize): ModelStatic<Model> => {
  const model = connection.define(
    tableName,
    {
      chatId: {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        references: {
          key: 'id',
          model: TABLES.chats,
        },
        type: DataTypes.INTEGER,
      },
      userId: {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        references: {
          key: 'id',
          model: TABLES.users,
        },
        type: DataTypes.INTEGER,
      },
    },
    {
      tableName,
      timestamps: true,
    },
  );

  return model;
};
