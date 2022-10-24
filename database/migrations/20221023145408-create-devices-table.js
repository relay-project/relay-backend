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
          type: Sequelize.STRING(128),
        },
        deviceName: {
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
