'use strict';

const TABLE_NAME = 'users';

/**
 * @typedef { import('sequelize-cli').Migration } Migration
 */

/** @type { Migration } */
const migration = {
  async down(queryInterface) {
    return queryInterface.dropTable(TABLE_NAME);
  },
  async up(queryInterface, Sequelize) {

  },
};
