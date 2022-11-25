const COLUMN_NAME = 'newMessages';
const TABLE_NAME = 'user_chats';

/** @type { import('sequelize-cli').Migration } */
module.exports = {
  async down(queryInterface) {
    return queryInterface.removeColumn(
      TABLE_NAME,
      COLUMN_NAME,
    );
  },
  async up(queryInterface, Sequelize) {
    return queryInterface.addColumn(
      TABLE_NAME,
      COLUMN_NAME,
      {
        defaultValue: 0,
        type: Sequelize.INTEGER,
      },
    );
  },
};
