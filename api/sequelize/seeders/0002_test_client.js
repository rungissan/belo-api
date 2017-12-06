'use strict';

const Promise = require('bluebird');

const path    = require('path');
const server  = require(path.resolve(__dirname, '../../server/server.js'));

const Application = server.models.OAuthClientApplication;

// TODO: replace test data
const clientData = [{
  id: 'spiti_web',
  clientSecret: 'spiti_seb_pass',
  name: 'spiti_web'
}, {
  id: 'fb_android',
  clientSecret: 'fb_android_pass',
  name: 'fb_android'
}, {
  id: 'fb_ios',
  clientSecret: 'fb_ios_pass',
  name: 'fb_ios'
}];

module.exports = {
  up() {
    return Application.create(clientData);
  },
  down() {
    return true;
  }
};
