'use strict';

module.exports = (app) => {
  app.dataSources.postgres.autoupdate();
};
