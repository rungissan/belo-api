'use strict';

import {
  defaultFields,
  CASCADE_RULES,
  BASE_SCHEMA
} from '../utils';

const saved_feed = (DataTypes) => ({
  id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
  userId: {
    type: DataTypes.INTEGER,
    references: {model: {tableName: 'user', ...BASE_SCHEMA}},
    ...CASCADE_RULES,
    allowNull: false
  },
  name:              { type: DataTypes.STRING },
  type:              { type: DataTypes.STRING(20) },
  title:             { type: DataTypes.STRING },
  description:       { type: DataTypes.STRING },
  displayAddress:    { type: DataTypes.BOOLEAN },
  showInBrokerFeed:  { type: DataTypes.BOOLEAN },
  geolocations:      { type: DataTypes.JSONB, defaultValue: {} },
  feedOptions:       { type: DataTypes.JSONB, defaultValue: {} },
  openHouse:         { type: DataTypes.JSONB, defaultValue: {} },
  additionalFilters: { type: DataTypes.JSONB, defaultValue: {} },
  ...defaultFields(DataTypes)
});

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('saved_feed', saved_feed(DataTypes), BASE_SCHEMA);
  },
  down: (queryInterface) => {
    return queryInterface.dropTable('saved_feed');
  }
};
