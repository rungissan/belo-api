'use strict';
let config = {};

if (process.env.PRODUCTION_MODE == 'ON') {
  config['loopback-component-explorer'] = null;
}

module.exports = config;
