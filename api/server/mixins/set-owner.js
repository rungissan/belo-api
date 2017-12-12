'use strict';

import { errUnauthorized } from '../lib/errors.js';

// NOTE: mixins order is important. if use ReadOnly mixin to protect userId, set it first by order
// not to override userId
/**
 * @desc Mixin that add user id from token when creating model
 * @param {Object} Model
 * @param {Object} [options]
 * @param {String} [options.ownerKey=userId] user id key
 * @returns {String}
 */
export default function(Model, options = {}) {
  let ownerKey = options.ownerKey || 'userId';

  Model.beforeRemote('create', (ctx, modelInstance, next) => {
    const token = ctx.args.options && ctx.args.options.accessToken;
    const userId = token && token.userId;

    if (!userId) {
      return next(errUnauthorized());
    }

    let instance = ctx.args.instance || ctx.args.data;

    if (!instance[ownerKey]) {
      instance[ownerKey] = userId;
    }

    next();
  });
};
