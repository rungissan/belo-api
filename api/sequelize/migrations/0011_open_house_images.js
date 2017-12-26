'use strict';

import {
  defaultFields,
  CASCADE_RULES,
  BASE_SCHEMA
} from '../utils';

const attachment_to_open_house = (DataTypes) => ({
  id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
  attachmentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {model: {tableName: 'attachment', ...BASE_SCHEMA}},
    ...CASCADE_RULES
  },
  openHouseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {model: {tableName: 'open_house', ...BASE_SCHEMA}},
    ...CASCADE_RULES
  }
});

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('attachment_to_open_house', attachment_to_open_house(DataTypes), BASE_SCHEMA)
      .then(() => queryInterface.addIndex(
        `${BASE_SCHEMA.schema}.attachment_to_open_house`,
        ['attachmentId', 'openHouseId'],
        {
          indicesType: 'UNIQUE'
        }
      ))
      .then(() => {
        return queryInterface.addColumn({tableName: 'open_house', ...BASE_SCHEMA},
          'userId',
          {
            type: DataTypes.INTEGER,
            references: {model: {tableName: 'user', ...BASE_SCHEMA}},
            ...CASCADE_RULES,
            allowNull: false
          }
        );
      });
  },
  down: (queryInterface) => {
    return queryInterface.dropTable({
      tableName: 'attachment_to_open_house',
      ...BASE_SCHEMA
    })
      .then(() => queryInterface.removeColumn({tableName: 'open_house', ...BASE_SCHEMA}, 'userId'));
  }
};
