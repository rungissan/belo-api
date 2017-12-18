// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: loopback-component-oauth2
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

import passport from 'passport';
import log from 'debug';
import { BasicStrategy } from 'passport-http';
import { Strategy as ClientPasswordStrategy } from 'passport-oauth2-client-password';

import modelBuilder        from './models/index';
import setupResourceServer, { getAccessTokenCheckHandler } from './resource-server';

const debug = log('loopback:oauth2');

/**
 *
 * @param {Object} app The app instance
 * @param {Object} options The options object
 * @property {Function} generateToken A custom function to generate tokens
 * @property {boolean} session
 * @property {String[]} supportedGrantTypes
 * @property {boolean} configureEndpoints
 * @returns {{}}
 */
module.exports = function(app, options) {
  options = options || {};
  var models = modelBuilder(app, options);

  var handlers = {};
  app._oauth2Handlers = handlers;

  // Default to true
  var session = (options.session !== false);

  app.middleware('auth:before', passport.initialize());
  if (session) {
    app.middleware('auth', passport.session());
  }

  handlers.authenticate     = setupResourceServer(app, options, models);
  handlers.checkAccessToken = getAccessTokenCheckHandler(app, options, models);

  if (options.useClientCredentialsStrategy == false) {
    return handlers;
  }

  function clientLogin(clientId, clientSecret, done) {
    debug('clientLogin: %s', clientId);
    models.clients.findByClientId(clientId, function(err, client) {
      if (err) {
        return done(err);
      }
      if (!client) {
        return done(null, false);
      }
      var secret = client.clientSecret || client.restApiKey;
      if (secret !== clientSecret) {
        return done(null, false);
      }
      return done(null, client);
    });
  }

  // Strategies for oauth2 client-id/client-secret login
  // HTTP basic
  passport.use('loopback-oauth2-client-basic', new BasicStrategy(clientLogin));
  // Body
  passport.use('loopback-oauth2-client-password',
    new ClientPasswordStrategy(clientLogin));

  handlers.authenticateClientMiddleware = passport.authenticate(
    ['loopback-oauth2-client-password', 'loopback-oauth2-client-basic'],
    {session: false}
  );

  return handlers;
};
