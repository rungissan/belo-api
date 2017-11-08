'use strict';

// import oauth2 from 'loopback-component-oauth2';
import oauth2 from '../lib/oauth';

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

  const auth = oauth2.authenticate({
    session: false,
    scopes: ['DEFAULT']
  });

  const PUBLIC_ROUTES = [{
    path: '/clients',
    method: 'POST'
  }, {
    path: '/clients/reset',
    method: 'POST'
  }, {
    path: '/clients/reset-password',
    method: 'POST'
  }, {
    path: '/clients/confirm',
    method: 'GET'
  }];

  app.use('/api', function(req, res, next) {
    if (PUBLIC_ROUTES.some(route => {
      return (req.path.toLowerCase() == route.path && (!route.method || route.method == req.method));
    })) {
      return handlers.authenticateClientMiddleware(req, res, next);
    } else {
      return auth(req, res, next);
    }
  });

  app.get('/me', function(req, res, next) {
    res.json({ 'user_id': req.user.id, name: req.user.username,
      accessToken: req.authInfo.accessToken });
  });

  app.enableAuth();
};
