'use strict';

import loopbackPassport from 'loopback-component-passport';
const PassportConfigurator = loopbackPassport.PassportConfigurator;

// let providersConfig = {};
// try {
//   providersConfig = require('../providers.json');
// } catch (err) {
//   console.trace(err);
//   process.exit(1); // fatal
// }
//
// import { createAccessToken } from '../lib/oauth/token-utils';
//
// function generateAccessToken(client, cb) {
//   return createAccessToken({ client });
// }

module.exports = function(app) {
  // const passportConfigurator = new PassportConfigurator(app);
  //
  // // attempt to build the providers/passport config
  // passportConfigurator.init();
  //
  // passportConfigurator.setupModels({
  //   userModel: app.models.Client,
  //   userIdentityModel: app.models.userIdentity,
  //   userCredentialModel: app.models.userCredential
  // });
  //
  // Object.keys(providersConfig).forEach(name => {
  //   let config = providersConfig[name];
  //
  //   config.session = config.session !== false;
  //   config.createAccessToken = generateAccessToken;
  //   passportConfigurator.configureProvider(name, config);
  // });
};
