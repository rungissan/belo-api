'use strict';

import {  BASE_SCHEMA } from '../utils';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.addColumn(
      {tableName: 'feed_options', ...BASE_SCHEMA},
      'keyDetails',
      { type: DataTypes.JSONB, defaultValue: {} }
    )
      .then(() => {
        return queryInterface.addColumn(
          {tableName: 'feed_options', ...BASE_SCHEMA},
          'feesAndCharges',
          { type: DataTypes.JSONB, defaultValue: {} }
        );
      });
  },
  down: (queryInterface) => {
    return queryInterface.removeColumn({tableName: 'feed_options', ...BASE_SCHEMA}, 'keyDetails')
      .then(() => queryInterface.removeColumn({tableName: 'feed_options', ...BASE_SCHEMA}, 'feesAndCharges'));
  }
};
