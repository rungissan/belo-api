'use strict';

import { cascadeRules } from '../utils';

const oauthaccesstoken = (DataTypes) => ({
  id:                { type: DataTypes.TEXT, allowNull: false, primaryKey: true },
  appid:             { type: DataTypes.TEXT, references: { model: 'oauthclientapplication', key: 'id' }, ...cascadeRules },
  userid:            { type: DataTypes.INTEGER, references: { model: 'user', key: 'id' }, ...cascadeRules },
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

const oauthauthorizationcode = (DataTypes) => ({
  id:          { type: DataTypes.TEXT, allowNull: false, primaryKey: true },
  appid:       { type: DataTypes.TEXT, references: { model: 'oauthclientapplication', key: 'id' }, ...cascadeRules },
  userid:      { type: DataTypes.INTEGER, references: { model: 'user', key: 'id' }, ...cascadeRules },
  issuedat:    { type: DataTypes.DATE },
  expiresin:   { type: DataTypes.INTEGER },
  expiredat:   { type: DataTypes.DATE },
  scopes:      { type: DataTypes.TEXT },
  parameters:  { type: DataTypes.TEXT },
  used:        { type: DataTypes.BOOLEAN },
  redirecturi: { type: DataTypes.TEXT },
  hash:        { type: DataTypes.TEXT }
});

const oauthclientapplication = (DataTypes) => ({
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

const oauthpermission = (DataTypes) => ({
  id:        { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
  appid:     { type: DataTypes.TEXT,    references: { model: 'oauthclientapplication', key: 'id' }, ...cascadeRules },
  userid:    { type: DataTypes.INTEGER, references: { model: 'user', key: 'id' }, ...cascadeRules },
  issuedat:  { type: DataTypes.DATE },
  expiresin: { type: DataTypes.INTEGER },
  expiredat: { type: DataTypes.DATE },
  scopes:    { type: DataTypes.TEXT }
});

const oauthscope = (DataTypes) => ({
  scope:       { type: DataTypes.TEXT, allowNull: false, primaryKey: true },
  description: { type: DataTypes.STRING(100) },
  iconurl:     { type: DataTypes.STRING },
  ttl:         { type: DataTypes.INTEGER }
});

const oauthscopemapping = (DataTypes) => ({
  id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
  scope: { type: DataTypes.TEXT },
  route: { type: DataTypes.TEXT }
});

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('oauthclientapplication', oauthclientapplication(DataTypes))
      .then(() => queryInterface.createTable('oauthauthorizationcode', oauthauthorizationcode(DataTypes)))
      .then(() => queryInterface.createTable('oauthaccesstoken', oauthaccesstoken(DataTypes)))
      .then(() => queryInterface.createTable('oauthpermission', oauthpermission(DataTypes)))
      .then(() => queryInterface.createTable('oauthscope', oauthscope(DataTypes)))
      .then(() => queryInterface.createTable('oauthscopemapping', oauthscopemapping(DataTypes)));
  },
  down: (queryInterface) => {
    return queryInterface.dropTable('oauthscopemapping')
      .then(() => queryInterface.dropTable('oauthscope'))
      .then(() => queryInterface.dropTable('oauthpermission'))
      .then(() => queryInterface.dropTable('oauthaccesstoken'))
      .then(() => queryInterface.dropTable('oauthauthorizationcode'))
      .then(() => queryInterface.dropTable('oauthclientapplication'));
  }
};
