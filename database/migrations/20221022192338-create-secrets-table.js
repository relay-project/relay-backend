const TABLE_NAME = 'secrets';

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
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER,
          unique: true,
        },
        secret: {
          type: Sequelize.STRING(255),
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
