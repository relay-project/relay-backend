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
          field: 'created_at',
          type: Sequelize.DATE,
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
          field: 'recovery_answer',
          type: Sequelize.TEXT,
        },
        recoveryQuestion: {
          field: 'recovery_question',
          type: Sequelize.TEXT,
        },
        role: {
          defaultValue: 'user',
          type: Sequelize.STRING(16),
        },
        updatedAt: {
          allowNull: false,
          defaultValue: Sequelize.fn('now'),
          field: 'updated_at',
          type: Sequelize.DATE,
        },
      },
    );
  },
};
