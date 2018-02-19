'use strict';

import {
  defaultFields,
  CASCADE_RULES,
  BASE_SCHEMA
} from '../utils';

const connection = (DataTypes) => ({
  id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {model: {tableName: 'account', ...BASE_SCHEMA}, key: 'userId'},
    ...CASCADE_RULES
  },
  connectedId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {model: {tableName: 'account', ...BASE_SCHEMA}, key: 'userId'},
    ...CASCADE_RULES
  },
  status: {
    // looks like bug in sequelize https://github.com/sequelize/sequelize/issues/8078, temporary use simple varchar
    // type: DataTypes.ENUM('new', 'connected', 'rejected')
    type: DataTypes.STRING(20)
  }
});

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('connection', connection(DataTypes), BASE_SCHEMA)
      .then(() => queryInterface.addIndex(
        `${BASE_SCHEMA.schema}.connection`,
        ['userId', 'connectedId'],
        {
          indicesType: 'UNIQUE'
        }
      ));
  },
  down: (queryInterface) => {
    return queryInterface.dropTable({
      tableName: 'connection',
      ...BASE_SCHEMA
    });
  }
};
