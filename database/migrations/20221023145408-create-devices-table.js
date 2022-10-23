const TABLE_NAME = 'devices';

/** @type { import('sequelize-cli').Migration } */
module.exports = {
  async down(queryInterface) {
    return queryInterface.dropTable(TABLE_NAME);
  },
  async up(queryInterface, Sequelize) {
    return queryInterface.createTable(
      TABLE_NAME,
      {
        createdAt: {
          allowNull: false,
          defaultValue: Sequelize.fn('now'),
          type: Sequelize.DATE,
        },
        deviceId: {
          field: 'device_id',
          type: Sequelize.STRING(128),
        },
        deviceName: {
          field: 'device_name',
          type: Sequelize.STRING(128),
        },
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
          unique: true,
        },
        userId: {
          field: 'user_id',
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
          references: {
            key: 'id',
            model: 'users',
          },
          type: Sequelize.INTEGER,
        },
        updatedAt: {
          allowNull: false,
          defaultValue: Sequelize.fn('now'),
          type: Sequelize.DATE,
        },
      },
    );
  },
};
