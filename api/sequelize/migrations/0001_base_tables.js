'use strict';

import {
  defaultFields,
  CASCADE_RULES,
  BASE_SCHEMA
} from '../utils';

const user = (DataTypes) => ({
  id:                { type: DataTypes.INTEGER,     allowNull: false, primaryKey: true, autoIncrement: true },
  // firstname:         { type: DataTypes.STRING(100) },
  // lastname:          { type: DataTypes.STRING(100) },
  username:          { type: DataTypes.STRING(100) },
  email:             { type: DataTypes.STRING,      allowNull: false, unique: true },
  realm:             { type: DataTypes.STRING },
  password:          { type: DataTypes.STRING,      allowNull: false },
  verificationtoken: { type: DataTypes.STRING },
  // description:       { type: DataTypes.STRING },
  emailverified:     { type: DataTypes.BOOLEAN },
  ...defaultFields(DataTypes)
});

const account = (DataTypes) => ({
  userid: { type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {model: {tableName: 'user', ...BASE_SCHEMA}},
    ...CASCADE_RULES
  },
  type:               { type: DataTypes.STRING(20) },
  first_name:         { type: DataTypes.STRING(30) },
  last_name:          { type: DataTypes.STRING(30) },
  username:           { type: DataTypes.STRING(30) },
  phone:              { type: DataTypes.STRING(30) },
  about:              { type: DataTypes.TEXT },
  biography:          { type: DataTypes.TEXT },
  brokerage:          { type: DataTypes.STRING(100) },
  license_type:       { type: DataTypes.STRING(50) },
  license_state:      { type: DataTypes.STRING(4) },
  license_number:     { type: DataTypes.INTEGER },
  license_expiration: { type: DataTypes.DATE },
  avatar_id:     { type: DataTypes.INTEGER, references: {model: {tableName: 'attachment', ...BASE_SCHEMA}}, ...CASCADE_RULES },
  background_id: { type: DataTypes.INTEGER, references: {model: {tableName: 'attachment', ...BASE_SCHEMA}}, ...CASCADE_RULES },
  ...defaultFields(DataTypes)
});

const accesstoken = (DataTypes) => ({
  id:      { type: DataTypes.TEXT,    allowNull: false },
  ttl:     { type: DataTypes.INTEGER, defaultValue: 1209600 },
  scopes:  { type: DataTypes.TEXT },
  created: { type: DataTypes.DATE },
  userid: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {model: {tableName: 'user', ...BASE_SCHEMA}},
    onUpdate: 'cascade',
    onDelete: 'cascade'
  }
});

const verifytoken = (DataTypes) => ({
  id:      { type: DataTypes.STRING(20),    allowNull: false },
  ttl:     { type: DataTypes.INTEGER, defaultValue: 900 },
  scopes:  { type: DataTypes.TEXT },
  created: { type: DataTypes.DATE },
  userid: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {model: {tableName: 'user', ...BASE_SCHEMA}},
    onUpdate: 'cascade',
    onDelete: 'cascade'
  }
});

const acl = (DataTypes) => ({
  id:            { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
  model:         { type: DataTypes.STRING(50) },
  property:      { type: DataTypes.STRING },
  accesstype:    { type: DataTypes.STRING },
  permission:    { type: DataTypes.STRING },
  principaltype: { type: DataTypes.STRING },
  principalid:   { type: DataTypes.STRING }
});

const role = (DataTypes) => ({
  id:          { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
  name:        { type: DataTypes.TEXT, allowNull: false },
  description: { type: DataTypes.STRING(100) },
  created:     { type: DataTypes.DATE },
  modified:    { type: DataTypes.DATE }
});

const rolemapping = (DataTypes) => ({
  id:            { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
  principaltype: { type: DataTypes.TEXT },
  principalid:   { type: DataTypes.TEXT },
  roleid:        { type: DataTypes.INTEGER }
});

const attachment = (DataTypes) => ({
  id:             { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
  userid:         { type: DataTypes.INTEGER, references: {model: {tableName: 'user', ...BASE_SCHEMA}}, ...CASCADE_RULES },
  url:            { type: DataTypes.STRING },
  public_url:     { type: DataTypes.STRING },
  type:           { type: DataTypes.STRING(20) },
  size:           { type: DataTypes.INTEGER },
  name:           { type: DataTypes.STRING },
  container:      { type: DataTypes.STRING },
  container_root: { type: DataTypes.STRING },
  public:         { type: DataTypes.BOOLEAN, defaultValue: true },
  sizes:          { type: DataTypes.JSONB }
});

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.sequelize.query(`CREATE SCHEMA IF NOT EXISTS ${BASE_SCHEMA.schema}`)
      .then(() =>  queryInterface.createTable('user', user(DataTypes), BASE_SCHEMA))
      .then(() => queryInterface.createTable('accesstoken', accesstoken(DataTypes), BASE_SCHEMA))
      .then(() => queryInterface.createTable('verification_token', verifytoken(DataTypes), BASE_SCHEMA))
      .then(() => queryInterface.createTable('acl', acl(DataTypes), BASE_SCHEMA))
      .then(() => queryInterface.createTable('role', role(DataTypes), BASE_SCHEMA))
      .then(() => queryInterface.createTable('rolemapping', rolemapping(DataTypes), BASE_SCHEMA))
      .then(() => queryInterface.createTable('attachment', attachment(DataTypes), BASE_SCHEMA))
      .then(() => queryInterface.createTable('account', account(DataTypes), BASE_SCHEMA));
  },
  down: (queryInterface) => {
    return queryInterface.dropTable('user')
      .then(() => queryInterface.dropTable('account'))
      .then(() => queryInterface.dropTable('accesstoken'))
      .then(() => queryInterface.dropTable('verification_token'))
      .then(() => queryInterface.dropTable('acl'))
      .then(() => queryInterface.dropTable('role'))
      .then(() => queryInterface.dropTable('rolemapping'))
      .then(() => queryInterface.dropTable('attachment'));
  }
};
