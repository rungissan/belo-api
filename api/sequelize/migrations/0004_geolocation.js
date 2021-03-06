'use strict';

import {
  defaultFields,
  CASCADE_RULES,
  BASE_SCHEMA
} from '../utils';

const geolocation = (DataTypes) => ({
  id:                          { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
  place_id:                    { type: DataTypes.TEXT,    allowNull: false },
  formatted_address:           { type: DataTypes.TEXT,    allowNull: false },
  country:                     { type: DataTypes.STRING },
  administrative_area_level_1: { type: DataTypes.STRING },
  administrative_area_level_2: { type: DataTypes.STRING },
  administrative_area_level_3: { type: DataTypes.STRING },
  locality:                    { type: DataTypes.STRING },
  sublocality:                 { type: DataTypes.STRING },
  route:                       { type: DataTypes.STRING },
  street_number:               { type: DataTypes.INTEGER },
  postal_code:                 { type: DataTypes.STRING(20) },
  location:                    { type: 'POINT' },
  data:                        { type: DataTypes.JSONB },
  ...defaultFields(DataTypes)
});

const geolocation_to_user = (DataTypes) => ({
  id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
  geolocation_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {model: {tableName: 'geolocation', ...BASE_SCHEMA}},
    ...CASCADE_RULES
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {model: {tableName: 'user', ...BASE_SCHEMA}},
    ...CASCADE_RULES
  }
});

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('geolocation', geolocation(DataTypes), BASE_SCHEMA)
      .then(() => queryInterface.createTable('geolocation_to_user', geolocation_to_user(DataTypes), BASE_SCHEMA))
      .then(() => queryInterface.addIndex(
        `${BASE_SCHEMA.schema}.geolocation_to_user`,
        ['geolocation_id', 'user_id'],
        {
          indicesType: 'UNIQUE'
        }
      ));
  },
  down: (queryInterface) => {
    return queryInterface.dropTable('geolocation_to_user')
      .then(() => queryInterface.dropTable('geolocation'));
  }
};
