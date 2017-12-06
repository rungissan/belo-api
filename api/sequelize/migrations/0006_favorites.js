'use strict';

import {
  defaultFields,
  CASCADE_RULES,
  BASE_SCHEMA
} from '../utils';

const favorite_feed = (DataTypes) => ({
  id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {model: {tableName: 'user', ...BASE_SCHEMA}},
    ...CASCADE_RULES
  },
  feed_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {model: {tableName: 'feed', ...BASE_SCHEMA}},
    ...CASCADE_RULES
  }
});

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('favorite_feed', favorite_feed(DataTypes), BASE_SCHEMA)
      .then(() => queryInterface.addIndex(
        `${BASE_SCHEMA.schema}.favorite_feed`,
        ['user_id', 'feed_id'],
        {
          indicesType: 'UNIQUE'
        }
      ));
  },
  down: (queryInterface) => {
    return queryInterface.dropTable('favorite_feed');
  }
};
