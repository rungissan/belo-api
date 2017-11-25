'use strict';

import {
  CASCADE_RULES,
  BASE_SCHEMA
} from '../utils';

const user_identity = (DataTypes) => ({
  id:          { type: DataTypes.TEXT, allowNull: false, primaryKey: true },
  userid:      { type: DataTypes.INTEGER, references: {model: {tableName: 'user', ...BASE_SCHEMA}}, ...CASCADE_RULES },
  clientid:    { type: DataTypes.INTEGER },
  provider:    { type: DataTypes.TEXT },
  authscheme:  { type: DataTypes.TEXT },
  externalid:  { type: DataTypes.TEXT },
  profile:     { type: DataTypes.TEXT },
  credentials: { type: DataTypes.TEXT },
  created:     { type: DataTypes.DATE },
  modified:    { type: DataTypes.DATE }
});

const user_credential = (DataTypes) => ({
  id:          { type: DataTypes.TEXT, allowNull: false, primaryKey: true },
  userid:      { type: DataTypes.INTEGER, references: {model: {tableName: 'user', ...BASE_SCHEMA}}, ...CASCADE_RULES },
  clientid:    { type: DataTypes.INTEGER },
  provider:    { type: DataTypes.TEXT },
  authscheme:  { type: DataTypes.TEXT },
  externalid:  { type: DataTypes.TEXT },
  profile:     { type: DataTypes.TEXT },
  credentials: { type: DataTypes.TEXT },
  created:     { type: DataTypes.DATE },
  modified:    { type: DataTypes.DATE }
});

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('user_credential', user_credential(DataTypes), BASE_SCHEMA)
      .then(() => queryInterface.createTable('user_identity', user_identity(DataTypes), BASE_SCHEMA));
  },
  down: (queryInterface) => {
    return queryInterface.dropTable('user_credential')
      .then(() => queryInterface.dropTable('user_identity'));
  }
};
