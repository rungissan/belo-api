'use strict';

import {
  defaultFields,
  CASCADE_RULES,
  BASE_SCHEMA
} from '../utils';

const feed = (DataTypes) => ({
  id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
  userId: {
    type: DataTypes.INTEGER,
    references: {model: {tableName: 'user', ...BASE_SCHEMA}},
    ...CASCADE_RULES,
    allowNull: false
  },
  imageId: {
    type: DataTypes.INTEGER,
    references: {model: {tableName: 'attachment', ...BASE_SCHEMA}},
    ...CASCADE_RULES
  },
  parentId: {
    type: DataTypes.INTEGER,
    references: {model: {tableName: 'feed', ...BASE_SCHEMA}},
    ...CASCADE_RULES
  },
  type:             { type: DataTypes.STRING(20) },
  title:            { type: DataTypes.STRING },
  description:      { type: DataTypes.TEXT },
  displayAddress:   { type: DataTypes.BOOLEAN, defaultValue: true },
  showInBrokerFeed: { type: DataTypes.BOOLEAN, defaultValue: true },
  ...defaultFields(DataTypes)
});

// NOTE: Used JSONB instead of EAV model mostly because loopback orm not using sql joins. It may cause perfomance problem
// when query all related data.
const feed_options = (DataTypes) => ({
  feedId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {model: {tableName: 'feed', ...BASE_SCHEMA}},
    ...CASCADE_RULES
  },
  rentType:           { type: DataTypes.STRING(20), defaultValue: 'rent' },
  bedrooms:           { type: DataTypes.INTEGER },
  bathrooms:          { type: DataTypes.INTEGER },
  price:              { type: DataTypes.INTEGER }, // cents
  square:             { type: DataTypes.FLOAT },
  propertyFeatures:   { type: DataTypes.JSONB, defaultValue: {} },
  buildingFeatures:   { type: DataTypes.JSONB, defaultValue: {} },
  utilitiesIncluded:  { type: DataTypes.JSONB, defaultValue: {} },
  moveInFees:         { type: DataTypes.JSONB, defaultValue: {} },
  schoolInformation:  { type: DataTypes.JSONB, defaultValue: {} },
  transportation:     { type: DataTypes.JSONB, defaultValue: {} },
  additionalFeatures: { type: DataTypes.JSONB, defaultValue: {} },
  ...defaultFields(DataTypes)
});

const attachment_to_feed = (DataTypes) => ({
  id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
  attachmentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {model: {tableName: 'attachment', ...BASE_SCHEMA}},
    ...CASCADE_RULES
  },
  feedId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {model: {tableName: 'feed', ...BASE_SCHEMA}},
    ...CASCADE_RULES
  }
});

const geolocation_to_feed = (DataTypes) => ({
  id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
  geolocationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {model: {tableName: 'geolocation', ...BASE_SCHEMA}},
    ...CASCADE_RULES
  },
  feedId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {model: {tableName: 'feed', ...BASE_SCHEMA}},
    ...CASCADE_RULES
  }
});

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('feed', feed(DataTypes), BASE_SCHEMA)
      .then(() => queryInterface.createTable('feed_options', feed_options(DataTypes), BASE_SCHEMA))
      .then(() => queryInterface.createTable('attachment_to_feed', attachment_to_feed(DataTypes), BASE_SCHEMA))
      .then(() => queryInterface.createTable('geolocation_to_feed', geolocation_to_feed(DataTypes), BASE_SCHEMA))
      .then(() => queryInterface.addIndex(
        `${BASE_SCHEMA.schema}.attachment_to_feed`,
        ['attachmentId', 'feedId'],
        {
          indicesType: 'UNIQUE'
        }
      ))
      .then(() => queryInterface.addIndex(
        `${BASE_SCHEMA.schema}.geolocation_to_feed`,
        ['geolocationId', 'feedId'],
        {
          indicesType: 'UNIQUE'
        }
      ));
  },
  down: (queryInterface) => {
    return queryInterface.dropTable('geolocation_to_feed')
      .then(() => queryInterface.dropTable('attachment_to_feed'))
      .then(() => queryInterface.dropTable('feed_options'))
      .then(() => queryInterface.dropTable('feed'));
  }
};
