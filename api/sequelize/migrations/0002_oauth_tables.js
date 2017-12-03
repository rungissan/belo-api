'use strict';

import {
  CASCADE_RULES,
  BASE_SCHEMA,
  AUTH_SCHEMA
} from '../utils';

const oauth_access_token = (DataTypes) => ({
  id: { type: DataTypes.TEXT, allowNull: false, primaryKey: true },
  appid: {
    type: DataTypes.TEXT,
    references: {model: {tableName: 'oauth_client_application', ...AUTH_SCHEMA}},
    ...CASCADE_RULES
  },
  userid: {
    type: DataTypes.INTEGER,
    references: {model: {tableName: 'user', ...BASE_SCHEMA}},
    ...CASCADE_RULES
  },
  issuedat:          { type: DataTypes.DATE },
  expiresin:         { type: DataTypes.INTEGER },
  expiredat:         { type: DataTypes.DATE },
  scopes:            { type: DataTypes.TEXT },
  parameters:        { type: DataTypes.TEXT },
  authorizationcode: { type: DataTypes.TEXT },
  refreshtoken:      { type: DataTypes.TEXT },
  tokentype:         { type: DataTypes.STRING(50) },
  hash:              { type: DataTypes.TEXT }
});

const oauth_authorization_code = (DataTypes) => ({
  id: { type: DataTypes.TEXT, allowNull: false, primaryKey: true },
  appid: {
    type: DataTypes.TEXT,
    references: {model: {tableName: 'oauth_client_application', ...AUTH_SCHEMA}},
    ...CASCADE_RULES
  },
  userid: {
    type: DataTypes.INTEGER,
    references: {model: {tableName: 'user', ...BASE_SCHEMA}},
    ...CASCADE_RULES
  },
  issuedat:    { type: DataTypes.DATE },
  expiresin:   { type: DataTypes.INTEGER },
  expiredat:   { type: DataTypes.DATE },
  scopes:      { type: DataTypes.TEXT },
  parameters:  { type: DataTypes.TEXT },
  used:        { type: DataTypes.BOOLEAN },
  redirecturi: { type: DataTypes.TEXT },
  hash:        { type: DataTypes.TEXT }
});

const oauth_client_application = (DataTypes) => ({
  id:              { type: DataTypes.STRING(50), allowNull: false, primaryKey: true },
  clienttype:      { type: DataTypes.TEXT },
  redirecturis:    { type: DataTypes.TEXT },
  tokenendpointauthmethod: { type: DataTypes.TEXT },
  granttypes:      { type: DataTypes.TEXT },
  responsetypes:   { type: DataTypes.TEXT },
  tokentype:       { type: DataTypes.TEXT },
  clientsecret:    { type: DataTypes.STRING(50) },
  clientname:      { type: DataTypes.STRING },
  clienturi:       { type: DataTypes.STRING },
  logouri:         { type: DataTypes.STRING },
  scopes:          { type: DataTypes.STRING },
  contacts:        { type: DataTypes.STRING },
  tosuri:          { type: DataTypes.STRING },
  policyuri:       { type: DataTypes.STRING },
  jwksuri:         { type: DataTypes.STRING },
  jwks:            { type: DataTypes.STRING },
  softwareid:      { type: DataTypes.STRING },
  softwareversion: { type: DataTypes.STRING },
  realm:           { type: DataTypes.STRING },
  name:            { type: DataTypes.STRING(50), allowNull: false },
  description:     { type: DataTypes.STRING(100) },
  owner:           { type: DataTypes.STRING },
  collaborators:   { type: DataTypes.STRING },
  email:           { type: DataTypes.STRING },
  emailverified:   { type: DataTypes.BOOLEAN },
  clientkey:       { type: DataTypes.STRING },
  javascriptkey:   { type: DataTypes.STRING },
  restapikey:      { type: DataTypes.STRING },
  windowskey:      { type: DataTypes.STRING },
  masterkey:       { type: DataTypes.STRING },
  pushsettings:    { type: DataTypes.TEXT },
  status:          { type: DataTypes.STRING(50), defaultValue: 'sandbox' },
  created:         { type: DataTypes.DATE },
  modified:        { type: DataTypes.DATE }
});

const oauth_permission = (DataTypes) => ({
  id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
  appid: {
    type: DataTypes.TEXT,
    references: {model: {tableName: 'oauth_client_application', ...AUTH_SCHEMA}},
    ...CASCADE_RULES
  },
  userid: {
    type: DataTypes.INTEGER,
    references: {model: {tableName: 'user', ...BASE_SCHEMA}},
    ...CASCADE_RULES
  },
  issuedat:  { type: DataTypes.DATE },
  expiresin: { type: DataTypes.INTEGER },
  expiredat: { type: DataTypes.DATE },
  scopes:    { type: DataTypes.TEXT }
});

const oauth_scope = (DataTypes) => ({
  scope:       { type: DataTypes.TEXT, allowNull: false, primaryKey: true },
  description: { type: DataTypes.STRING(100) },
  iconurl:     { type: DataTypes.STRING },
  ttl:         { type: DataTypes.INTEGER }
});

const oauth_scopemapping = (DataTypes) => ({
  id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
  scope: { type: DataTypes.TEXT },
  route: { type: DataTypes.TEXT }
});

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.sequelize.query(`CREATE SCHEMA IF NOT EXISTS ${AUTH_SCHEMA.schema}`)
      .then(() =>  queryInterface.createTable('oauth_client_application', oauth_client_application(DataTypes), AUTH_SCHEMA))
      .then(() => queryInterface.createTable('oauth_authorization_code', oauth_authorization_code(DataTypes), AUTH_SCHEMA))
      .then(() => queryInterface.createTable('oauth_access_token', oauth_access_token(DataTypes), AUTH_SCHEMA))
      .then(() => queryInterface.createTable('oauth_permission', oauth_permission(DataTypes), AUTH_SCHEMA))
      .then(() => queryInterface.createTable('oauth_scope', oauth_scope(DataTypes), AUTH_SCHEMA))
      .then(() => queryInterface.createTable('oauth_scopemapping', oauth_scopemapping(DataTypes), AUTH_SCHEMA));
  },
  down: (queryInterface) => {
    return queryInterface.dropTable('oauth_scopemapping')
      .then(() => queryInterface.dropTable('oauth_scope'))
      .then(() => queryInterface.dropTable('oauth_permission'))
      .then(() => queryInterface.dropTable('oauth_access_token'))
      .then(() => queryInterface.dropTable('oauth_authorization_code'))
      .then(() => queryInterface.dropTable('oauth_client_application'));
  }
};
