'use strict';

import { errUnauthorized } from '../lib/errors.js';

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
