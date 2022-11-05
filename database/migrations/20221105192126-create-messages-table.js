const TABLE_NAME = 'messages';

/** @type { import('sequelize-cli').Migration } */
module.exports = {
  async down(queryInterface) {
    return queryInterface.dropTable(TABLE_NAME);
  },
  async up(queryInterface, Sequelize) {
    return queryInterface.createTable(
      TABLE_NAME,
      {
        authorId: {
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
          references: {
            key: 'id',
            model: 'users',
          },
          type: Sequelize.INTEGER,
        },
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
        edited: {
          defaultValue: false,
          type: Sequelize.BOOLEAN,
        },
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
          unique: true,
        },
        text: {
          type: Sequelize.TEXT,
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
