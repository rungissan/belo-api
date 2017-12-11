'use strict';

import {
  defaultFields,
  CASCADE_RULES,
  BASE_SCHEMA
} from '../utils';

const favorite_feed = (DataTypes) => ({
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
    references: {model: {tableName: 'feed', ...BASE_SCHEMA}},
    ...CASCADE_RULES
  }
});

const geolocation_to_account = (DataTypes) => ({
  id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
  geolocationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {model: {tableName: 'geolocation', ...BASE_SCHEMA}},
    ...CASCADE_RULES
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {model: {tableName: 'account', ...BASE_SCHEMA}, key: 'userId'},
    ...CASCADE_RULES
  }
});

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('favorite_feed', favorite_feed(DataTypes), BASE_SCHEMA)
      .then(() => queryInterface.createTable('geolocation_to_account', geolocation_to_account(DataTypes), BASE_SCHEMA))
      .then(() => queryInterface.addIndex(
        `${BASE_SCHEMA.schema}.favorite_feed`,
        ['userId', 'feedId'],
        {
          indicesType: 'UNIQUE'
        }
      ))
      .then(() => queryInterface.addIndex(
        `${BASE_SCHEMA.schema}.geolocation_to_account`,
        ['userId', 'geolocationId'],
        {
          indicesType: 'UNIQUE'
        }
      ));
  },
  down: (queryInterface) => {
    return queryInterface.dropTable('favorite_feed')
      .then(() => queryInterface.dropTable('geolocation_to_account'));
  }
};
