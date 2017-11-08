'use strict';

import oauth2 from 'loopback-component-oauth2';

module.exports = function enableAuthentication(app) {
  const options = {
    dataSource: app.dataSources.postgres,
    loginPage: false,
    loginPath: false,
    resourceServer: true,
    authorizationServer: false
  };

  oauth2.oAuth2Provider(app, options);

  const auth = oauth2.authenticate({
    session: false,
    scopes: ['DEFAULT']
  });

  const PUBLIC_ROUTES = [{
    path: '/clients',
    method: 'POST'
  }, {
    path: '/clients/confirm',
    method: 'GET'
  }];

  app.use('/api', function(req, res, next) {
    if (PUBLIC_ROUTES.some(route => {
      return (req.path.toLowerCase() == route.path && (!route.method || route.method == req.method));
    })) {
      return next();
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
