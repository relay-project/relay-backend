const TABLE_NAME = 'users';

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
        failedLoginAttempts: {
          defaultValue: 0,
          type: Sequelize.INTEGER,
        },
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
          unique: true,
        },
        login: {
          type: Sequelize.STRING(32),
        },
        recoveryAnswer: {
          type: Sequelize.TEXT,
        },
        recoveryQuestion: {
          type: Sequelize.TEXT,
        },
        role: {
          defaultValue: 'user',
          type: Sequelize.STRING(16),
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
