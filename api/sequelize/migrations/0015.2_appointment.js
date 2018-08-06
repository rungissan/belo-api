'use strict';

import {
  CASCADE_RULES,
  BASE_SCHEMA
} from '../utils';

const appointment = (DataTypes) => ({
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
  listingOwnerId: {
    type: DataTypes.INTEGER
  },
  status: {
    type: DataTypes.INTEGER
  },
  date: { type: DataTypes.DATE },
  time: { type: DataTypes.DATE },
  created_at: { type: DataTypes.DATE },
  updated_at: { type: DataTypes.DATE },
  deleted_at: { type: DataTypes.DATE },
});

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('appointment', appointment(DataTypes), BASE_SCHEMA)
      .then(() => queryInterface.addIndex(
        `${BASE_SCHEMA.schema}.appointment`,
        ['userId', 'feedId']
      ));
  },
  down: (queryInterface) => {
    return queryInterface.dropTable({
      tableName: 'appointment',
      ...BASE_SCHEMA
    });
  }
};