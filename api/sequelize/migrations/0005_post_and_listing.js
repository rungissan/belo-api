'use strict';

import {
  defaultFields,
  CASCADE_RULES,
  BASE_SCHEMA
} from '../utils';

// NOTE: Used JSONB instead of EAV model mostly because loopback orm not using sql joins. It may cause perfomance problem
// when query all related data.
const listing = (DataTypes) => ({
  id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
  user_id: {
    type: DataTypes.INTEGER,
    references: {model: {tableName: 'user', ...BASE_SCHEMA}},
    ...CASCADE_RULES,
    allowNull: false
  },
  geolocation_id: {
    type: DataTypes.INTEGER,
    references: {model: {tableName: 'geolocation', ...BASE_SCHEMA}},
    ...CASCADE_RULES,
    allowNull: false
  },
  image_id: {
    type: DataTypes.INTEGER,
    references: {model: {tableName: 'attachment', ...BASE_SCHEMA}},
    ...CASCADE_RULES
  },
  title:               { type: DataTypes.STRING },
  description:         { type: DataTypes.TEXT },
  display_address:     { type: DataTypes.BOOLEAN, defaultValue: true },
  show_in_broker_feed: { type: DataTypes.BOOLEAN, defaultValue: true },
  rent_type:           { type: DataTypes.STRING(20), defaultValue: 'rent' },
  bedrooms:            { type: DataTypes.INTEGER },
  bathrooms:           { type: DataTypes.INTEGER },
  price:               { type: DataTypes.INTEGER }, // cents
  square:              { type: DataTypes.FLOAT },
  property_features:   { type: DataTypes.JSONB, defaultValue: {} },
  building_features:   { type: DataTypes.JSONB, defaultValue: {} },
  utilities_included:  { type: DataTypes.JSONB, defaultValue: {} },
  move_in_fees:        { type: DataTypes.JSONB, defaultValue: {} },
  school_information:  { type: DataTypes.JSONB, defaultValue: {} },
  transportation:      { type: DataTypes.JSONB, defaultValue: {} },
  additional_features: { type: DataTypes.JSONB, defaultValue: {} },
  ...defaultFields(DataTypes)
});

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
  // geolocation_id: {
  //   type: DataTypes.INTEGER,
  //   references: {model: {tableName: 'geolocation', ...BASE_SCHEMA}},
  //   ...CASCADE_RULES,
  //   allowNull: false
  // },
  listing_id: {
    type: DataTypes.INTEGER,
    references: {model: {tableName: 'listing', ...BASE_SCHEMA}},
    ...CASCADE_RULES
  },
  title:          { type: DataTypes.STRING },
  description:    { type: DataTypes.TEXT },
  ...defaultFields(DataTypes)
});

const attachment_to_listing = (DataTypes) => ({
  id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
  attachment_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {model: {tableName: 'listing', ...BASE_SCHEMA}},
    ...CASCADE_RULES
  },
  listing_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {model: {tableName: 'post', ...BASE_SCHEMA}},
    ...CASCADE_RULES
  }
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

const geolocation_to_post = (DataTypes) => ({
  id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
  geolocation_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {model: {tableName: 'geolocation', ...BASE_SCHEMA}},
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
    return queryInterface.createTable('listing', listing(DataTypes), BASE_SCHEMA)
      .then(() => queryInterface.createTable('post', post(DataTypes), BASE_SCHEMA))
      .then(() => queryInterface.createTable('attachment_to_post', attachment_to_post(DataTypes), BASE_SCHEMA))
      .then(() => queryInterface.createTable('attachment_to_listing', attachment_to_listing(DataTypes), BASE_SCHEMA))
      .then(() => queryInterface.createTable('geolocation_to_post', geolocation_to_post(DataTypes), BASE_SCHEMA))
      .then(() => queryInterface.addIndex(
        `${BASE_SCHEMA.schema}.attachment_to_post`,
        ['attachment_id', 'post_id'],
        {
          indicesType: 'UNIQUE'
        }
      ))
      .then(() => queryInterface.addIndex(
        `${BASE_SCHEMA.schema}.attachment_to_listing`,
        ['attachment_id', 'listing_id'],
        {
          indicesType: 'UNIQUE'
        }
      ))
      .then(() => queryInterface.addIndex(
        `${BASE_SCHEMA.schema}.geolocation_to_post`,
        ['geolocation_id', 'post_id'],
        {
          indicesType: 'UNIQUE'
        }
      ));
  },
  down: (queryInterface) => {
    return queryInterface.dropTable('attachment_to_listing')
      .then(() => queryInterface.dropTable('attachment_to_post'))
      .then(() => queryInterface.dropTable('geolocation_to_post'))
      .then(() => queryInterface.dropTable('post'))
      .then(() => queryInterface.dropTable('listing'));
  }
};
