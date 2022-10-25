import {
  DataTypes,
  type Model,
  type ModelStatic,
  type Sequelize,
} from 'sequelize';

import { TABLES } from '../../configuration';

export const tableName = TABLES.devices;

export const createModel = (connection: Sequelize): ModelStatic<Model> => {
  const model = connection.define(
    tableName,
    {
      deviceId: {
        type: DataTypes.STRING(128),
      },
      deviceName: {
        type: DataTypes.STRING(128),
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
