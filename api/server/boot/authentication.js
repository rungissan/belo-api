'use strict';

import oauth2 from '../lib/oauth';
import { errUnauthorized } from '../lib/errors';

const debug = require('debug')('spiti:boot:authentication');

import setupIoHandlers from '../lib/socket';

module.exports = function enableAuthentication(app) {
  const options = {
    dataSource: app.dataSources.postgres,
    loginPage: false,
    loginPath: false,
    resourceServer: true,
    authorizationServer: false,
    useClientCredentialsStrategy: true
  };

  const handlers = oauth2.oAuth2Provider(app, options);

  const PUBLIC_ROUTES = [{
    path: '/clients',
    method: 'POST'
  }, {
    path: '/clients/password-reset',
    method: 'POST'
  }, {
    path: '/clients/password-update',
    method: 'POST'
  }, {
    path: '/clients/confirm-email',
    method: 'GET'
  }, {
    path: '/clients/check-code',
    method: 'POST'
  }];

  app.use('/api', function(req, res, next) {
    if (PUBLIC_ROUTES.some(route => {
      return (req.path.toLowerCase() == route.path && (!route.method || route.method == req.method));
    })) {
      return handlers.authenticateClientMiddleware(req, res, next);
    } else {
      return oauth2.authenticate({
        session: false,
        scopes: ['DEFAULT']
      }, (err, user, info) => {
        if (err) {
          return next(err);
        } else if (!user) {
          return next(errUnauthorized());
        } else {
          return next();
        }
      })(req, res, next);
    }
  });

  app.get('/me', function(req, res, next) {
    res.json({ 'user_id': req.user.id, name: req.user.username,
      accessToken: req.authInfo.accessToken });
  });

  app.enableAuth();

  if (!(app.ioHandlers && app.ioHandlers.length)) {
    return;
  }

  app.on('started', function() {
    setupIoHandlers(app, handlers.checkAccessToken);
  });
};
