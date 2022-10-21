import {
  DataTypes,
  Deferrable,
  Model,
  ModelStatic,
  type Sequelize,
} from 'sequelize';

import { TABLES } from '../../configuration';

export const tableName = TABLES.Passwords;

export const createModel = (connection: Sequelize): ModelStatic<Model> => {
  const model = connection.define(
    tableName,
    {
      hash: {
        type: DataTypes.STRING(255),
      },
      userId: {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        references: {
          deferrable: Deferrable.INITIALLY_DEFERRED(),
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
