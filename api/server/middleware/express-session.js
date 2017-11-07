'use strict';

import sessions    from 'express-session';
import RedisStore  from 'connect-redis';

import dataSources from '../datasources';

const redisStore   = RedisStore(sessions);
const sessionStore = new redisStore(dataSources.redisSession);

module.exports = function() {
  console.log('iiiiiiiiiiiii')
  return sessions({
    store: sessionStore,
    saveUninitialized: true,
    resave: true,
    secret: 'dAZVfD5at3l0rl419t4Qr6MIbQmrTLBiidbi5TVoCghBy5Ipb'
  });
  //
  // "saveUninitialized": true,
  //       "resave": true,
};
