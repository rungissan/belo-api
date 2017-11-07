'use strict'
var oauth2 = require('loopback-component-oauth2')

module.exports = function (server) {
  var options = {
    // custom user model
    userModel: server.models.user,
    applicationModel: server.models.Application,
    // -------------------------------------
    // Resource Server properties
    // -------------------------------------
    resourceServer: true,

    // used by modelBuilder, loopback-component-oauth2/models/index.js
    // Data source for oAuth2 metadata persistence
    dataSource: server.dataSources.postgres,

    // -------------------------------------
    // Authorization Server properties
    // -------------------------------------
    authorizationServer: true,
    resourceServer: true,

    // path to mount the authorization endpoint
    authorizePath: '/oauth/authorize',

    // path to mount the token endpoint
    tokenPath: '/oauth/token',

    // backend api does not host the login page
    loginPage: '/oauth/login',
    loginPath: '/oauth/login',

    // grant types that should be enabled
    supportedGrantTypes: [
      'implicit',
      'jwt',
      'clientCredentials',
      'authorizationCode',
      'refreshToken',
      'resourceOwnerPasswordCredentials'
    ]
  }
  oauth2.oAuth2Provider(
    server,
    options
  )
  var auth = oauth2.authenticate({ session: false, scope: 'devices' })
  server.middleware('auth:before', [
    '/api/users/oauth/',
    '/api/users/oauth/resources',
    '/api/devices/*/oauth/resources/',
    '/api/devices/*/oauth/groups/'
  ], auth)
}
