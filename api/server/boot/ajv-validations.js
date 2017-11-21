'use strict';

const debug = require('debug')('spiti:boot');

import validate from '../lib/validate';

module.exports = (app) => {
  const modelNames = Object.keys(app.models);

  modelNames.forEach(name => {
    addValidators(app.models[name]);
  });
};

function addValidators(Model) {
  const modelConfig = Model.settings;

  let validations = modelConfig['ajv-validations'] || {};

  let remoteHooks = validations.remoteHooks || {};

  Object.keys(remoteHooks).forEach(remoteName => {
    Model.beforeRemote(remoteName, function(ctx, modelInstance, next) {
      let instance = ctx.args.instance || ctx.args.data;
      return validate(instance, remoteHooks[remoteName])
        .then(() => next())
        .catch(next);
    });
  });
}
