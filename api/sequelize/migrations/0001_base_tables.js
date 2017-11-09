'use strict';

const defaultFields = (DataTypes) => {
  return {
    created_at: {type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.fn('NOW')},
    updated_at: {type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.fn('NOW')},
    deleted_at: {type: DataTypes.DATE, allowNull: true}
  }
};

const clients = (DataTypes) => {return {
  id:                { type: DataTypes.INTEGER,     allowNull: false, primaryKey: true, autoIncrement: true },
  firstname:         { type: DataTypes.STRING(100) },
  lastname:          { type: DataTypes.STRING(100) },
  username:          { type: DataTypes.STRING(100) },
  email:             { type: DataTypes.STRING,      allowNull: false, unique: true },
  realm:             { type: DataTypes.STRING },
  password:          { type: DataTypes.STRING,      allowNull: false },
  verificationtoken: { type: DataTypes.STRING },
  description:       { type: DataTypes.STRING },
  emailverified:     { type: DataTypes.BOOLEAN },
  ...defaultFields(DataTypes)
}};

const accesstoken = (DataTypes) => {return {
  id:      { type: DataTypes.TEXT,    allowNull: false },
  ttl:     { type: DataTypes.INTEGER, defaultValue: 1209600 },
  scopes:  { type: DataTypes.TEXT },
  created: { type: DataTypes.DATE },
  userid: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {model: 'client', key: 'id'},
    onUpdate: 'cascade',
    onDelete: 'cascade'
  }
}};

const verifytoken = (DataTypes) => {return {
  id:      { type: DataTypes.TEXT,    allowNull: false },
  ttl:     { type: DataTypes.INTEGER, defaultValue: 900 },
  scopes:  { type: DataTypes.TEXT },
  created: { type: DataTypes.DATE },
  userid: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {model: 'client', key: 'id'},
    onUpdate: 'cascade',
    onDelete: 'cascade'
  }
}};

const acl = (DataTypes) => {return {
  id:            { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
  model:         { type: DataTypes.TEXT },
  property:      { type: DataTypes.TEXT },
  accesstype:    { type: DataTypes.TEXT },
  permission:    { type: DataTypes.TEXT },
  principaltype: { type: DataTypes.TEXT },
  principalid:   { type: DataTypes.TEXT }
}};

const role = (DataTypes) => {return {
  id:          { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
  name:        { type: DataTypes.TEXT, allowNull: false },
  description: { type: DataTypes.TEXT },
  created:     { type: DataTypes.DATE },
  modified:    { type: DataTypes.DATE }
}};

const rolemapping = (DataTypes) => {return {
  id:            { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
  principaltype: { type: DataTypes.TEXT },
  principalid:   { type: DataTypes.TEXT },
  roleid:        { type: DataTypes.INTEGER }
}};

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('client', clients(DataTypes))
      .then(() => queryInterface.createTable('accesstoken', accesstoken(DataTypes)))
      .then(() => queryInterface.createTable('verification_token', verifytoken(DataTypes)))
      .then(() => queryInterface.createTable('acl', acl(DataTypes)))
      .then(() => queryInterface.createTable('role', role(DataTypes)))
      .then(() => queryInterface.createTable('rolemapping', rolemapping(DataTypes)))
  },
  down: (queryInterface) => {
    return queryInterface.dropTable('client')
      .then(() => queryInterface.dropTable('accesstoken'))
      .then(() => queryInterface.dropTable('verification_token'))
      .then(() => queryInterface.dropTable('acl'))
      .then(() => queryInterface.dropTable('role'))
      .then(() => queryInterface.dropTable('rolemapping'))
  }
};
