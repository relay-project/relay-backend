import {
  DataTypes,
  type Model,
  type ModelStatic,
  type Sequelize,
} from 'sequelize';

import { CHAT_TYPES, TABLES } from '../../configuration';

export const tableName = TABLES.chats;

export const createModel = (connection: Sequelize): ModelStatic<Model> => {
  const model = connection.define(
    tableName,
    {
      createdBy: {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        references: {
          key: 'id',
          model: TABLES.users,
        },
        type: DataTypes.INTEGER,
      },
      name: {
        type: DataTypes.STRING(256),
      },
      type: {
        defaultValue: CHAT_TYPES.private,
        type: DataTypes.STRING(16),
      },
    },
    {
      tableName,
      timestamps: true,
    },
  );

  return model;
};
