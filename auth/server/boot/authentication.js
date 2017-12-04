'use strict';

// import oauth2 from 'loopback-component-oauth2';
import oauth2 from '../lib/oauth';

import sessions    from 'express-session';
import RedisStore  from 'connect-redis';

import dataSources from '../datasources';

const redisStore   = RedisStore(sessions);
const sessionStore = new redisStore(dataSources.redisSession);

const bodyParser      = require('body-parser');
const cookieParser    = require('cookie-parser');

import providersConfig from '../providers';

module.exports = function enableAuthentication(app) {
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended: false}));
  app.use(cookieParser());
  app.middleware('session', sessions({
    store: sessionStore,
    saveUninitialized: true,
    resave: true,
    secure: false,
    secret: 'dAZVfD5at3l0rl419t4Qr6MIbQmrTLBiidbi5TVoCghBy5Ipb'
  }));

  const options = {
    dataSource: app.dataSources.postgres,
    loginPage: '/login',
    loginPath: '/login',
    resourceServer: true,
    session: false,
    allowsPostForAuthorization: true,
    ttl: 3600,
    providers: providersConfig
  };

  oauth2.oAuth2Provider(
    app,
    options
  );

  app.enableAuth();
};
