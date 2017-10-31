'use strict';

const errors = require('../../server/lib/errors.js');

module.exports = function(Listing) {
  Listing.beforeRemote('create', (ctx, modelInstance, next) => {
    const token = ctx.args.options && ctx.args.options.accessToken;
    const userId = token && token.userId;

    if (!userId) {
      return next(errors.unauthorized());
    }

    let instance = ctx.args.instance || ctx.args.data;
    if (!instance.ownerId) {
      instance.ownerId = userId;
    }

    next();
  });
};
