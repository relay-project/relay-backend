import {
  DataTypes,
  Model,
  ModelStatic,
  type Sequelize,
} from 'sequelize';

import {
  MAX_LOGIN_LENGTH,
  ROLES,
  TABLES,
} from '../../configuration';

export const tableName = TABLES.Users;

export const createModel = (connection: Sequelize): ModelStatic<Model> => {
  const model = connection.define(
    tableName,
    {
      login: {
        type: DataTypes.STRING(MAX_LOGIN_LENGTH),
      },
      recoveryAnswer: {
        type: DataTypes.TEXT,
      },
      recoveryQuestion: {
        type: DataTypes.TEXT,
      },
      role: {
        defaultValue: ROLES.user,
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
