import {
  DataTypes,
  Model,
  ModelStatic,
  type Sequelize,
} from 'sequelize';

import { TABLES } from '../../configuration';

export const tableName = TABLES.devices;

export const createModel = (connection: Sequelize): ModelStatic<Model> => {
  const model = connection.define(
    tableName,
    {
      deviceId: {
        field: 'device_id',
        type: DataTypes.STRING(128),
      },
      deviceName: {
        field: 'device_name',
        type: DataTypes.STRING(128),
      },
      userId: {
        field: 'user_id',
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
