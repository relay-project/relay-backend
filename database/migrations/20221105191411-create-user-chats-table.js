const TABLE_NAME = 'user_chats';

/** @type { import('sequelize-cli').Migration } */
module.exports = {
  async down(queryInterface) {
    return queryInterface.dropTable(TABLE_NAME);
  },
  async up(queryInterface, Sequelize) {
    return queryInterface.createTable(
      TABLE_NAME,
      {
        chatId: {
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
          references: {
            key: 'id',
            model: 'chats',
          },
          type: Sequelize.INTEGER,
        },
        createdAt: {
          allowNull: false,
          defaultValue: Sequelize.fn('now'),
          type: Sequelize.DATE,
        },
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
          unique: true,
        },
        updatedAt: {
          allowNull: false,
          defaultValue: Sequelize.fn('now'),
          type: Sequelize.DATE,
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
      },
    );
  },
};
