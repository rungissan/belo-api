'use strict';

import {
  CASCADE_RULES,
  BASE_SCHEMA
} from '../utils';

const statusCheck = (DataTypes) => ({
  id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {model: {tableName: 'account', ...BASE_SCHEMA}, key: 'userId'},
    ...CASCADE_RULES
  },
  feedId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {model: {tableName: 'feed', ...BASE_SCHEMA}, key: 'id'},
    ...CASCADE_RULES
  },
  status: {
    type: DataTypes.INTEGER
  },
  created_at: { type: DataTypes.DATE },
  updated_at: { type: DataTypes.DATE },
  deleted_at: { type: DataTypes.DATE }
});

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('status_check', statusCheck(DataTypes), BASE_SCHEMA)
      .then(() => queryInterface.addIndex(
        `${BASE_SCHEMA.schema}.status_check`,
        ['userId', 'feedId'],
        {
          indicesType: 'UNIQUE'
        }
      ));
  },
  down: (queryInterface) => {
    return queryInterface.dropTable({
      tableName: 'status_check',
      ...BASE_SCHEMA
    });
  }
};