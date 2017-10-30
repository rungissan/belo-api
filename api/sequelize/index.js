'use strict';

module.exports = {
  db: {
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    host: process.env.POSTGRES_HOST || 'postgres',
    port: process.env.POSTGRES_PORT || 5432,
    dialect: 'postgres',
    pool: {
      max: 10,
      min: 0,
      idle: 10000
    },
    query: { type: 'SELECT', logging: process.env.SHOW_DB_QUERY != 0 ? console.log : false },
    define: {
      timestamps: true,
      paranoid: true,
      individualHooks: true,
      underscored: true
    },
    logging: process.env.SHOW_DB_QUERY != 0 ? console.log : false,
    benchmark: process.env.SHOW_DB_QUERY != 0 ? console.log : false,
    seederStorage: 'sequelize'
  }
};
