'use strict';

// oauth tables

const cascadeRules = { onUpdate: 'cascade', onDelete: 'cascade'};

const useridentity = (DataTypes) => ({
  id:          { type: DataTypes.TEXT, allowNull: false, primaryKey: true },
  userid:      { type: DataTypes.INTEGER, references: { model: 'user', key: 'id' }, ...cascadeRules },
  clientid:    { type: DataTypes.INTEGER },
  provider:    { type: DataTypes.TEXT },
  authscheme:  { type: DataTypes.TEXT },
  externalid:  { type: DataTypes.TEXT },
  profile:     { type: DataTypes.TEXT },
  credentials: { type: DataTypes.TEXT },
  created:     { type: DataTypes.DATE },
  modified:    { type: DataTypes.DATE }
});

const usercredential = (DataTypes) => ({
  id:          { type: DataTypes.TEXT, allowNull: false, primaryKey: true },
  userid:      { type: DataTypes.INTEGER, references: { model: 'user', key: 'id' }, ...cascadeRules },
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
    return queryInterface.createTable('usercredential', usercredential(DataTypes))
      .then(() => queryInterface.createTable('useridentity', useridentity(DataTypes)));
  },
  down: (queryInterface) => {
    return queryInterface.dropTable('usercredential')
      .then(() => queryInterface.dropTable('useridentity'));
  }
};
