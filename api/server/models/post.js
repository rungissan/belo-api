'use strict';

import errors from '../lib/errors.js';

module.exports = function(Post) {
  Post.beforeRemote('create', (ctx, modelInstance, next) => {
    const token = ctx.args.options && ctx.args.options.accessToken;
    const userId = token && token.userId;

    if (!userId) {
      return next(errors.errUnauthorized());
    }

    let instance = ctx.args.instance || ctx.args.data;
    if (!instance.userId) {
      instance.userId = userId;
    }

    next();
  });
};