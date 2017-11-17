'use strict';

const defaultFields = (DataTypes) => {
  return {
    created_at: {type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.fn('NOW')},
    updated_at: {type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.fn('NOW')},
    deleted_at: {type: DataTypes.DATE, allowNull: true}
  };
};

const listing = (DataTypes) => ({
  id:          { type: DataTypes.INTEGER,     allowNull: false, primaryKey: true, autoIncrement: true },
  ownerid: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {model: 'user', key: 'id'},
    onUpdate: 'cascade',
    onDelete: 'cascade'
  },
  title:       { type: DataTypes.STRING(250), allowNull: false },
  description: { type: DataTypes.STRING },
  ...defaultFields(DataTypes)
});

const zipcode = (DataTypes) => ({
  id:      { type: DataTypes.INTEGER,     allowNull: false, primaryKey: true, autoIncrement: true },
  zipcode: { type: DataTypes.STRING(50), allowNull: false },
  name:    { type: DataTypes.STRING(50) },
  ...defaultFields(DataTypes)
});

const listing_to_zipcode = (DataTypes) => ({
  id:         { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
  listing_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'listing', key: 'id' },
    onUpdate: 'cascade',
    onDelete: 'cascade'
  },
  zipcode_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'zipcode', key: 'id' },
    onUpdate: 'cascade',
    onDelete: 'cascade'
  }
});

// TODO: implement listings table, refactor zipcodes (use gmaps geolocation)
module.exports = {
  up: (queryInterface, DataTypes) => {
    return true;
    // return queryInterface.createTable('zipcode', zipcode(DataTypes))
    //   .then(() => queryInterface.createTable('listing', listing(DataTypes)))
    //   .then(() => queryInterface.createTable('listing_to_zipcode', listing_to_zipcode(DataTypes)));
  },
  down: (queryInterface) => {
    return true;
    // return queryInterface.dropTable('listing_to_zipcode')
    //   .then(() => queryInterface.dropTable('listing'))
    //   .then(() => queryInterface.dropTable('zipcode'));
  }
};
