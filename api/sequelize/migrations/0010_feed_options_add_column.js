'use strict';

import {  BASE_SCHEMA } from '../utils';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.addColumn({tableName: 'feed_options', ...BASE_SCHEMA},
      'propertyType',
      {
        type: DataTypes.TEXT
      }
    );
  },
  down: (queryInterface) => {
    return queryInterface.removeColumn({tableName: 'feed_options', ...BASE_SCHEMA}, 'propertyType');
  }
};
