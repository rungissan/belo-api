'use strict';

import {
  errUnauthorized
} from '../lib/errors.js';

export default function(Model, options = {}) {
  Model.afterRemote('find', (ctx, modelInstance, next) => {
    const token = ctx.args.options && ctx.args.options.accessToken;
    const userId = token && token.userId;
    let results = ctx.result;
    let ds = Model.app.dataSources.postgres;
    let replacements = [];
    let filter = ctx.args && ctx.args.filter || {};
    let self = this;
    console.log(filter);
    if (!userId) {
      return next(errUnauthorized());
    }

    if (!(results && results.length)) {
      return next();
    }
    if (!(!ctx.alredyCalled && filter && filter.where && filter.offset == 0 && filter.where.type == 'listing')) {
      return next();
    }
    const query = `SELECT sum(case when "rentType" = 'rent' then 1 else 0 end) as rent,
                   sum(case when "rentType" = 'sale' then 1 else 0 end) as sale,
                   sum(case when "feedStatus" = 0 then 1 else 0 end) as available from "spiti"."feed" AS "Feed"
                  LEFT JOIN "spiti"."feed_options" AS "feedOptions" ON "feedOptions"."feedId" = "Feed"."id"
                  WHERE "Feed"."userId" = $1 AND "Feed"."type" = 'listing' AND "Feed". "deleted_at" Is NULL`;
    replacements.push(userId);
    new Promise(
     (resolve, reject) => {
       ds.connector.execute(query, replacements, (err, data) => {
         if (err) {
           console.log(err);
           let error = new Error('Error occured');
           return reject(next(error));
         }
         let resultss = ctx.result;
         resultss.forEach(feed => feed.counts = data[0]);
         ctx.result = resultss;
         return resolve(next());
       });
     });
  });
};
