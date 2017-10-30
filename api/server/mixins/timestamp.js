'use strict';

const Promise = require('bluebird');

module.exports = (Model, bootOptions = {}) => {
  const options = {
    createdKey: 'created_at',
    updatedKey: 'updated_at',
    deletedKey: 'deleted_at',
    required: true,
    validateUpsert: false,
    silenceWarnings: false,
    ...bootOptions
  };

  Model.defineProperty(options.createdKey, {
    type: Date,
    required: options.required,
    defaultFn: 'now'
  });

  Model.defineProperty(options.updatedKey, {
    type: Date,
    required: options.required,
    defaultFn: 'now'
  });

  Model.defineProperty(options.deletedKey, {
    type: Date,
    required: false
  });

  Model.destroyAllForce  = Model.destroyAll;
  Model.destroyByIdForce = Model.destroyById;
  let destroy = Model.prototype.destroy;

  Model.destroyAll = (where, cb) => {
    return Model.updateAll(where, {[options.deletedKey]: new Date()})
      .then(result => (typeof cb === 'function') ? cb(null, result) : result)
      .catch(error => (typeof cb === 'function') ? cb(error) : Promise.reject(error));
  };

  Model.destroyById = function softDestroyById(id, cb) {
    return Model.updateAll({id}, {[options.deletedKey]: new Date()})
      .then(result => (typeof cb === 'function') ? cb(null, result) : result)
      .catch(error => (typeof cb === 'function') ? cb(error) : Promise.reject(error));
  };

  Model.prototype.destroy = (options, cb) => {
    if (options && options.force) {
      destroy(options, cb);
    } else {
      const callback = (cb === undefined && typeof options === 'function') ? options : cb;

      return this.updateAttributes({[options.deletedKey]: new Date()})
        .then(result => (typeof cb === 'function') ? callback(null, result) : result)
        .catch(error => (typeof cb === 'function') ? callback(error) : Promise.reject(error));
    }
  };

  Model.observe('access', (ctx, next) => {
    if (!ctx.query.where) {
      ctx.query.where = {};
    }
    if (!ctx.query.where.hasOwnProperty(options.deletedKey) && !ctx.query.paranoid && ctx.Model.definition.properties[options.deletedKey]) {
      ctx.query.where[options.deletedKey] = null;
    }
    return next();
  });

  Model.observe('before save', (ctx, next) => {
    if (ctx.options && ctx.options.skipupdatedKey) {
      return next();
    }
    if (ctx.instance) {
      ctx.instance[options.updatedKey] = new Date();
    } else {
      ctx.data[options.updatedKey] = new Date();
    }
    return next();
  });
};
