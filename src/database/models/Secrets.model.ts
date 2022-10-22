import {
  DataTypes,
  Model,
  ModelStatic,
  type Sequelize,
} from 'sequelize';

import { TABLES } from '../../configuration';

export const tableName = TABLES.Secrets;

export const createModel = (connection: Sequelize): ModelStatic<Model> => {
  const model = connection.define(
    tableName,
    {
      secret: {
        type: DataTypes.STRING(255),
      },
      userId: {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        references: {
          key: 'id',
          model: TABLES.Users,
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
