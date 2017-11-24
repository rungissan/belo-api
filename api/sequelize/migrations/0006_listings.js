'use strict';

import { defaultFields, cascadeRules } from '../utils';

// NOTE: Used JSONB instead of EAV model mostly because loopback orm not using sql joins. It may cause perfomance problem
// when query all related data.
const listing = (DataTypes) => ({
  id:                  { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
  user_id:             { type: DataTypes.INTEGER, references: {model: 'user', key: 'id'}, ...cascadeRules, allowNull: false },
  title:               { type: DataTypes.STRING },
  description:         { type: DataTypes.TEXT },
  geolocation_id:      { type: DataTypes.INTEGER, references: {model: 'geolocation', key: 'id'}, ...cascadeRules, allowNull: false},
  image_id:            { type: DataTypes.INTEGER, references: {model: 'attachment',  key: 'id'}, ...cascadeRules },
  display_address:     { type: DataTypes.BOOLEAN, defaultValue: true },
  show_in_broker_feed: { type: DataTypes.BOOLEAN, defaultValue: true },
  rent_type:           { type: DataTypes.STRING(20), defaultValue: 'rent' },
  bedrooms:            { type: DataTypes.INTEGER },
  bathrooms:           { type: DataTypes.INTEGER },
  price:               { type: DataTypes.INTEGER }, // cents
  square:              { type: DataTypes.FLOAT },
  property_features:   { type: DataTypes.JSONB, defaultValue: {} },
  building_features:   { type: DataTypes.JSONB, defaultValue: {} },
  utilities_included:  { type: DataTypes.JSONB, defaultValue: {} },
  move_in_fees:        { type: DataTypes.JSONB, defaultValue: {} },
  school_information:  { type: DataTypes.JSONB, defaultValue: {} },
  transportation:      { type: DataTypes.JSONB, defaultValue: {} },
  additional_features: { type: DataTypes.JSONB, defaultValue: {} },
  ...defaultFields(DataTypes)
});

const attachment_to_listing = (DataTypes) => ({
  id:            { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
  attachment_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'listing', key: 'id' }, ...cascadeRules},
  listing_id:    { type: DataTypes.INTEGER, allowNull: false, references: { model: 'post',    key: 'id' }, ...cascadeRules}
});

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('listing', listing(DataTypes))
      .then(() => queryInterface.createTable('attachment_to_listing', attachment_to_listing(DataTypes)))
      .then(() => queryInterface.addIndex(
        'attachment_to_listing',
        ['attachment_id', 'listing_id'],
        {
          indicesType: 'UNIQUE'
        }
      ));
  },
  down: (queryInterface) => {
    return queryInterface.dropTable('attachment_to_listing')
      .then(() => queryInterface.dropTable('listing'));
  }
};
