'use strict';


import sessions    from 'express-session';
import RedisStore  from 'connect-redis';

import dataSources from '../datasources';

const redisStore   = RedisStore(sessions);
const sessionStore = new redisStore(dataSources.redisSession);

const bodyParser      = require('body-parser');
const cookieParser    = require('cookie-parser');

module.exports = function enableAuthentication(app) {
  //
  // app.use(bodyParser.json());
  // app.use(bodyParser.urlencoded({extended: false}));
  // app.use(cookieParser());

  // app.use(sessions({
  //   store: sessionStore,
  //   saveUninitialized: true,
  //   resave: true,
  //   secure: false,
  //   secret: 'dAZVfD5at3l0rl419t4Qr6MIbQmrTLBiidbi5TVoCghBy5Ipb'
  // }));
  //
  //



  app.middleware('session', sessions({
    store: sessionStore,
    saveUninitialized: true,
    resave: true,
    secure: false,
    secret: 'dAZVfD5at3l0rl419t4Qr6MIbQmrTLBiidbi5TVoCghBy5Ipb'
  }));








  // enable authentication
  var oauth2 = require('loopback-component-oauth2');

  var options = {
    dataSource: app.dataSources.postgres, // Data source for oAuth2 metadata persistence
    loginPage: '/login', // The login page url
    loginPath: '/login', // The login form processing url
    resourceServer: true,
    session: false,
    allowsPostForAuthorization: true
  };

  oauth2.oAuth2Provider(
    app, // The app instance
    options // The options
  );

  var auth = oauth2.authenticate({session: false, scopes: ['DEFAULT', 'profile_read']});
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
