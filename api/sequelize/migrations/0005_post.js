'use strict';

import {
  defaultFields,
  CASCADE_RULES,
  BASE_SCHEMA
} from '../utils';

// TODO: Add relation to listings
const post = (DataTypes) => ({
  id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {model: {tableName: 'user', ...BASE_SCHEMA}},
    ...CASCADE_RULES
  },
  image_id: {
    type: DataTypes.INTEGER,
    references: {model: {tableName: 'attachment', ...BASE_SCHEMA}},
    ...CASCADE_RULES
  },
  geolocation_id: {
    type: DataTypes.INTEGER,
    references: {model: {tableName: 'geolocation', ...BASE_SCHEMA}},
    ...CASCADE_RULES,
    allowNull: false
  },
  title:          { type: DataTypes.STRING },
  description:    { type: DataTypes.TEXT },
  // listing_id:  { type: DataTypes.INTEGER, references: {model: 'listing', key: 'id'}, ...CASCADE_RULES },
  ...defaultFields(DataTypes)
});

const attachment_to_post = (DataTypes) => ({
  id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
  attachment_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {model: {tableName: 'attachment', ...BASE_SCHEMA}},
    ...CASCADE_RULES
  },
  post_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {model: {tableName: 'post', ...BASE_SCHEMA}},
    ...CASCADE_RULES
  }
});

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('post', post(DataTypes), BASE_SCHEMA)
      .then(() => queryInterface.createTable('attachment_to_post', attachment_to_post(DataTypes), BASE_SCHEMA))
      .then(() => queryInterface.addIndex(
        `${BASE_SCHEMA.schema}.attachment_to_post`,
        ['attachment_id', 'post_id'],
        {
          indicesType: 'UNIQUE'
        }
      ));
  },
  down: (queryInterface) => {
    return queryInterface.dropTable('attachment_to_post')
      .then(() => queryInterface.dropTable('post'));
  }
};
