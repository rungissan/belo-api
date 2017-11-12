'use strict';

// oauth tables

const oauthaccesstoken = (DataTypes) => ({
  id:                { type: DataTypes.TEXT, allowNull: false, primaryKey: true },
  appid:             { type: DataTypes.TEXT},
  userid:            { type: DataTypes.INTEGER },
  issuedat:          { type: DataTypes.DATE },
  expiresin:         { type: DataTypes.INTEGER },
  expiredat:         { type: DataTypes.DATE },
  scopes:            { type: DataTypes.TEXT },
  parameters:        { type: DataTypes.TEXT },
  authorizationcode: { type: DataTypes.TEXT },
  refreshtoken:      { type: DataTypes.TEXT },
  tokentype:         { type: DataTypes.TEXT },
  hash:              { type: DataTypes.TEXT }
});

const oauthauthorizationcode = (DataTypes) => ({
  id:          { type: DataTypes.TEXT, allowNull: false, primaryKey: true },
  appid:       { type: DataTypes.TEXT },
  userid:      { type: DataTypes.INTEGER },
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
  id:              { type: DataTypes.TEXT, allowNull: false, primaryKey: true },
  clienttype:      { type: DataTypes.TEXT },
  redirecturis:    { type: DataTypes.TEXT },
  tokenendpointauthmethod: { type: DataTypes.TEXT },
  granttypes:      { type: DataTypes.TEXT },
  responsetypes:   { type: DataTypes.TEXT },
  tokentype:       { type: DataTypes.TEXT },
  clientsecret:    { type: DataTypes.TEXT },
  clientname:      { type: DataTypes.TEXT },
  clienturi:       { type: DataTypes.TEXT },
  logouri:         { type: DataTypes.TEXT },
  scopes:          { type: DataTypes.TEXT },
  contacts:        { type: DataTypes.TEXT },
  tosuri:          { type: DataTypes.TEXT },
  policyuri:       { type: DataTypes.TEXT },
  jwksuri:         { type: DataTypes.TEXT },
  jwks:            { type: DataTypes.TEXT },
  softwareid:      { type: DataTypes.TEXT },
  softwareversion: { type: DataTypes.TEXT },
  realm:           { type: DataTypes.TEXT },
  name:            { type: DataTypes.TEXT, allowNull: false },
  description:     { type: DataTypes.TEXT },
  owner:           { type: DataTypes.TEXT },
  collaborators:   { type: DataTypes.TEXT },
  email:           { type: DataTypes.TEXT },
  emailverified:   { type: DataTypes.BOOLEAN },
  clientkey:       { type: DataTypes.TEXT },
  javascriptkey:   { type: DataTypes.TEXT },
  restapikey:      { type: DataTypes.TEXT },
  windowskey:      { type: DataTypes.TEXT },
  masterkey:       { type: DataTypes.TEXT },
  pushsettings:    { type: DataTypes.TEXT },
  status:          { type: DataTypes.TEXT, defaultValue: 'sandbox' },
  created:         { type: DataTypes.DATE },
  modified:        { type: DataTypes.DATE }
});

const oauthpermission = (DataTypes) => ({
  id:        { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
  appid:     { type: DataTypes.TEXT },
  userid:    { type: DataTypes.INTEGER },
  issuedat:  { type: DataTypes.DATE },
  expiresin: { type: DataTypes.INTEGER },
  expiredat: { type: DataTypes.DATE },
  scopes:    { type: DataTypes.TEXT }
});

const oauthscope = (DataTypes) => ({
  scope:       { type: DataTypes.TEXT, allowNull: false, primaryKey: true },
  description: { type: DataTypes.TEXT },
  iconurl:     { type: DataTypes.TEXT },
  ttl:         { type: DataTypes.INTEGER }
});

const oauthscopemapping = (DataTypes) => ({
  id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
  scope: { type: DataTypes.TEXT },
  route: { type: DataTypes.TEXT }
});

module.exports = {
  up: (queryInterface, DataTypes) => {
    return queryInterface.createTable('oauthaccesstoken', oauthaccesstoken(DataTypes))
      .then(() => queryInterface.createTable('oauthauthorizationcode', oauthauthorizationcode(DataTypes)))
      .then(() => queryInterface.createTable('oauthclientapplication', oauthclientapplication(DataTypes)))
      .then(() => queryInterface.createTable('oauthpermission', oauthpermission(DataTypes)))
      .then(() => queryInterface.createTable('oauthscope', oauthscope(DataTypes)))
      .then(() => queryInterface.createTable('oauthscopemapping', oauthscopemapping(DataTypes)));
  },
  down: (queryInterface) => {
    return queryInterface.dropTable('oauthscopemapping')
      .then(() => queryInterface.dropTable('oauthscope'))
      .then(() => queryInterface.dropTable('oauthpermission'))
      .then(() => queryInterface.dropTable('oauthclientapplication'))
      .then(() => queryInterface.dropTable('oauthauthorizationcode'))
      .then(() => queryInterface.dropTable('oauthaccesstoken'));
  }
};
