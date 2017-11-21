'use strict';

const debug = require('debug')('spiti:validations');

import validate from '../lib/validate';

const Promise = require('bluebird');

export default function(Model, options = {}) {
  const modelConfig = Model.settings;
  let remoteHooks = options.remoteHooks || {};

  Object.keys(remoteHooks).forEach(remoteName => {
    if (typeof remoteHooks[remoteName] == 'string') {
      Model.beforeRemote(remoteName, getValidteMiddleware(Model.modelName, remoteHooks[remoteName]));
    }
  });
};

function getValidteMiddleware(modelName, schemaName) {
  return async function validateMiddleware(ctx, modelInstance) {
    debug(`Validating by model: ${modelName}, schema ${schemaName}`);
    let instance = ctx.args.instance || ctx.args.data;
    return await validate(instance, modelName, schemaName);
  };
}
