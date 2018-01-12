export default {
  redisKue: {
    prefix: 'q',
    redis: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      auth: process.env.REDIS_PASSWORD,
      db: 2,
      options: {}
    }
  },
  redisSioAdapter: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    auth_pass: process.env.REDIS_PASSWORD
  },
  redisSocketKeys: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    auth_pass: process.env.REDIS_PASSWORD,
    db: 3
  },
  postgresql: {
    baseSchema: 'spiti',
    authSchems: 'auth'
  }
};
