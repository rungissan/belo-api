'use strict';

const debug = require('debug')('spiti:validations');
import Promise  from 'bluebird';

import validate from '../lib/validate';

export default function(Model, options = {}) {
  const modelConfig = Model.settings;
  let remoteHooks = options.remoteHooks || {};

  Object.keys(remoteHooks).forEach(remoteName => {
    Model.beforeRemote(remoteName, getValidteMiddleware(Model.modelName, remoteHooks[remoteName]));
  });
};

function getValidteMiddleware(modelName, options) {
  let schemaName;
  let instancePath;
  if (typeof options == 'string') {
    schemaName = options;
  } else if (typeof options == 'object') {
    if (typeof options.args == 'string') {
      instancePath = options.args;
    }
    schemaName = options.schema;
  }

  return async function validateMiddleware(ctx, modelInstance) {
    debug(`Validating by model: ${modelName}, ${schemaName}`);

    let instance;
    if (instancePath) {
      instance = ctx.args[instancePath];
    } else {
      instance = ctx.args.instance || ctx.args.data;
    }

    return await validate(instance, modelName, schemaName);
  };
}
