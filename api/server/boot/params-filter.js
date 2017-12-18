'use strict';

const options = {
  limit: 10
};

// TODO: refactor limit filters. allow to disable for some routes
module.exports = (app) => {
  return;

  app.remotes().before('**', (ctx, next) => {
    let filter = ctx.args && ctx.args.filter || {};

    if (filter.include) {
      // filter.include = normalizeInclude(filter.include);
    }

    applyLimit(filter);
    ctx.args.filter = filter;
    next();
  });

  function applyLimit(filter) {
    const requestLimit = Number(filter.limit) || options.limit;
    const limit = Math.min(requestLimit, options.limit);

    filter.limit = limit;
    return filter;
  }

  function normalizeInclude(include) {
    if (typeof include === 'string') {
      return {
        relation: include,
        scope: applyLimit({})
      };
    } else if (Array.isArray(include)) {
      return include.map(normalizeInclude);
    } else if (typeof include === 'object' && include !== null) {
      if (include.scope && include.scope.include) {
        include.scope.include = normalizeInclude(include.scope.include);
      }
      include.scope = applyLimit(include.scope || { });
      return include;
    }

    return null;
  }
};
