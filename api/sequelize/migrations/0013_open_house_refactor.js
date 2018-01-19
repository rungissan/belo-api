'use strict';

import {
  defaultFields,
  CASCADE_RULES,
  BASE_SCHEMA
} from '../utils';

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.addColumn({tableName: 'open_house', ...BASE_SCHEMA},
      'feedId',
      {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {model: {tableName: 'feed', ...BASE_SCHEMA}},
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      }
    )
      .then(() => {
        return queryInterface.sequelize.query(`
          UPDATE "spiti"."open_house" AS "house"
          SET "feedId" = "listing"."id"
          FROM "spiti"."feed" AS "listing"
          WHERE "listing"."openHouseId" = "house"."id";
        `);
      })
      .then(() => {
        return queryInterface.sequelize.query('DELETE FROM "spiti"."open_house" WHERE "feedId" IS NULL');
      })
      .then(() => {
        return queryInterface.sequelize.query('ALTER table "spiti"."open_house" ALTER COLUMN "feedId" SET NOT NULL');
      });
  },
  down: (queryInterface) => {
    return queryInterface.removeColumn({tableName: 'open_house', ...BASE_SCHEMA}, 'feedId');
  }
};
