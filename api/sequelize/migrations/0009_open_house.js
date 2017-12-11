'use strict';

import {
  defaultFields,
  CASCADE_RULES,
  BASE_SCHEMA
} from '../utils';

const open_house = (DataTypes) => ({
  // feedId: {
  //   type: DataTypes.INTEGER,
  //   allowNull: false,
  //   unique: true,
  //   primaryKey: true,
  //   references: {model: {tableName: 'feed', ...BASE_SCHEMA}},
  //   ...CASCADE_RULES
  // },
  id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
  host:         { type: DataTypes.TEXT },
  contactPhone: { type: DataTypes.STRING(100) },
  date:         { type: DataTypes.DATEONLY, allowNull: false },
  timeStart:    { type: DataTypes.TIME },
  timeEnd:      { type: DataTypes.TIME },
  ...defaultFields(DataTypes)
});

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('open_house', open_house(DataTypes), BASE_SCHEMA)
      .then(() => {
        return queryInterface.addColumn({tableName: 'feed', ...BASE_SCHEMA},
          'openHouseId',
          {
            type: DataTypes.INTEGER,
            unique: true,
            allowNull: true,
            references: {model: {tableName: 'open_house', ...BASE_SCHEMA}},
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL'
          }
        );
      });
  },
  down: (queryInterface) => {
    return queryInterface.removeColumn({tableName: 'feed', ...BASE_SCHEMA}, 'openHouseId')
      .then(() => {
        return queryInterface.dropTable({
          tableName: 'open_house',
          ...BASE_SCHEMA
        });
      });
  }
};
