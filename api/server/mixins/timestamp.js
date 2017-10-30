'use strict';

module.exports = (Model, bootOptions = {}) => {
  const options = {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    required: true,
    validateUpsert: false,
    silenceWarnings: false,
    ...bootOptions
  };

  Model.defineProperty(options.createdAt, {
    type: Date,
    required: options.required,
    defaultFn: 'now'
  });

  Model.defineProperty(options.updatedAt, {
    type: Date,
    required: options.required,
    defaultFn: 'now'
  });

  Model.defineProperty(options.deletedAt, {
    type: Date,
    required: false
  });

  Model.observe('before save', (ctx, next) => {
    if (ctx.options && ctx.options.skipUpdatedAt) {
      return next();
    }
    if (ctx.instance) {
      ctx.instance[options.updatedAt] = new Date();
    } else {
      ctx.data[options.updatedAt] = new Date();
    }
    return next();
  });

  Model.observe('before delete', (ctx, next) => {
    Model.updateAll(ctx.where, {[options.deletedAt]: new Date()})
      .then((result) => {
        next(null);
      })
      .catch(err => {
        return next(err);
      });
  });
};
