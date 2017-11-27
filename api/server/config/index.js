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
  postgresql: {
    baseSchema: 'spiti',
    authSchems: 'auth'
  }
};
