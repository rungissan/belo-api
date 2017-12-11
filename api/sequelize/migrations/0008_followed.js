'use strict';

import {
  defaultFields,
  CASCADE_RULES,
  BASE_SCHEMA
} from '../utils';

const followed = (DataTypes) => ({
  id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {model: {tableName: 'account', ...BASE_SCHEMA}, key: 'userId'},
    ...CASCADE_RULES
  },
  followedId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {model: {tableName: 'account', ...BASE_SCHEMA}, key: 'userId'},
    ...CASCADE_RULES
  }
});

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('followed', followed(DataTypes), BASE_SCHEMA)
      .then(() => queryInterface.addIndex(
        `${BASE_SCHEMA.schema}.followed`,
        ['userId', 'followedId'],
        {
          indicesType: 'UNIQUE'
        }
      ));
  },
  down: (queryInterface) => {
    return queryInterface.dropTable({
      tableName: 'followed',
      ...BASE_SCHEMA
    });
  }
};
