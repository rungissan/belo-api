'use strict';

module.exports = function enableAuthentication(app) {
  // enable authentication
  var oauth2 = require('loopback-component-oauth2');

  var options = {
    dataSource: app.dataSources.postgres, // Data source for oAuth2 metadata persistence
    loginPage: '/login_auth3', // The login page url
    loginPath: '/login_auth', // The login form processing url
    resourceServer: true,
    // session: false
  };

  oauth2.oAuth2Provider(
    app, // The app instance
    options // The options
  );

  var auth = oauth2.authenticate({session: false, scope: 'demo'});
  app.use(['/protected', '/api', '/me'], auth);

  /* jshint unused: vars */
  app.get('/me', function(req, res, next) {
    // req.authInfo is set using the `info` argument supplied by
    // `BearerStrategy`.  It is typically used to indicate scope of the token,
    // and used in access control checks.  For illustrative purposes, this
    // example simply returns the scope in the response.
    res.json({ 'user_id': req.user.id, name: req.user.username,
      accessToken: req.authInfo.accessToken });
  });

  app.enableAuth();
};
