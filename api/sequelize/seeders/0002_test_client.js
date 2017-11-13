'use strict';

const Promise = require('bluebird');

const path    = require('path');
const server  = require(path.resolve(__dirname, '../../server/server.js'));

const Application = server.models.OAuthClientApplication;

const clientData = {
  id: 'spiti_web',
  clientSecret: 'spiti_seb_pass',
  name: 'spiti_web'
};

module.exports = {
  up() {
    return Application.create(clientData);
  },
  down() {
    return true;
  }
};
