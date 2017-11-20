'use strict';

module.exports = (app) => {
  app.remotes().after('**', function(ctx, next) {
    if (!ctx.result) {
      ctx.result = {ok: true};
    }
    next();
  });
};
