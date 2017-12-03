'use strict';

import {
  defaultFields,
  CASCADE_RULES,
  BASE_SCHEMA
} from '../utils';

const favorite_post = (DataTypes) => ({
  id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {model: {tableName: 'user', ...BASE_SCHEMA}},
    ...CASCADE_RULES
  },
  post_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {model: {tableName: 'post', ...BASE_SCHEMA}},
    ...CASCADE_RULES
  }
});

const favorite_listing = (DataTypes) => ({
  id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {model: {tableName: 'user', ...BASE_SCHEMA}},
    ...CASCADE_RULES
  },
  listing_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {model: {tableName: 'listing', ...BASE_SCHEMA}},
    ...CASCADE_RULES
  }
});

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('favorite_post', favorite_post(DataTypes), BASE_SCHEMA)
      .then(() => queryInterface.createTable('favorite_listing', favorite_listing(DataTypes), BASE_SCHEMA));
  },
  down: (queryInterface) => {
    return queryInterface.dropTable('favorite_listing')
      .then(() => queryInterface.dropTable('favorite_post'));
  }
};
