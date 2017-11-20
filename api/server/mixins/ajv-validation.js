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
  return function validateMiddleware(ctx, modelInstance, next) {
    if (!next && typeof modelInstance == 'function') {
      next = modelInstance;
    }

    let instance = ctx.args.instance || ctx.args.data;

    validate(instance, modelName, schemaName)
      .then(() => {
        return next();
      })
      .catch(err => next(err));
  };
}
