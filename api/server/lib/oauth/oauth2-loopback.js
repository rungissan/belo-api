// Copyright IBM Corp. 2014,2016. All Rights Reserved.
// Node module: loopback-component-oauth2
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict';

import passport from 'passport';
import modelBuilder        from './models/index';
import setupResourceServer from './resource-server';

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

  if (options.resourceServer !== false) {
    handlers.authenticate = setupResourceServer(app, options, models, true);
  }

  return handlers;
};
