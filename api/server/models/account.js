'use strict';

import Promise from 'bluebird';

import FavoriteFeedSearch from '../lib/search/favorite-feed';

module.exports = function(Account) {
  Account.validatesLengthOf('licenseState',  {max: 4,   allowBlank: true, allowNull: true});
  Account.validatesLengthOf('licenseNumber', {max: 50,  allowBlank: true, allowNull: true});
  Account.validatesLengthOf('licenseType',   {max: 50,  allowBlank: true, allowNull: true});
  Account.validatesLengthOf('brokerage',     {max: 100, allowBlank: true, allowNull: true});
  Account.validatesLengthOf('phone',         {max: 30,  allowBlank: true, allowNull: true});
  Account.validatesLengthOf('userName',      {max: 30,  allowBlank: true, allowNull: true});
  Account.validatesLengthOf('lastName',      {max: 30,  allowBlank: true, allowNull: true});
  Account.validatesLengthOf('firstName',     {max: 30,  allowBlank: true, allowNull: true});
  Account.validatesLengthOf('type',          {max: 20,  allowBlank: true, allowNull: true});

  Account.validatesUniquenessOf('userName',  {max: 30});

  Account.afterRemote('findById', includeCounts);

  async function includeCounts(ctx, instance) {
    if (!(instance && instance.userId)) {
      return;
    }

    let filter = ctx.args && ctx.args.filter || {};
    let populate = filter.populate;
    if (!Array.isArray(populate)) {
      return;
    }

    let queries = {};
    const Followed = Account.app.models.Followed;

    if (populate.includes('followersCount')) {
      queries.followersCount = Followed.count({ followedId: instance.userId });
    }
    if (populate.includes('followedCount')) {
      queries.followedCount = Followed.count({ userId: instance.userId });
    }

    if (Object.keys(queries).length === 0) {
      return;
    }

    let props = await Promise.props(queries);

    ctx.result.followersCount = props.followersCount;
    ctx.result.followedCount = props.followedCount;

    return;
  };

  Account.prototype.getFavoriteFeeds = async function(ctx, filter) {
    const token = ctx.req.accessToken;
    const userId = token && token.userId;

    return await searchFavoriteFeeds(Account.app, userId, filter);
  };

  Account.remoteMethod(
    'prototype.getFavoriteFeeds',
    {
      description: 'Search by feed criterion.',
      accepts: [
        {arg: 'ctx',    type: 'object', http: { source: 'context' }},
        {arg: 'filter', type: 'object', required: true}
      ],
      returns: { arg: 'filters', type: 'Array', root: true},
      http: {verb: 'get', path: '/get-favorite-feeds'}
    }
  );

  async function searchFavoriteFeeds(app, userId, filter) {
    let { Feed } = app.models;

    if (!(filter && filter.where)) {
      return await Feed.find(filter);
    }
    let where = filter.where;

    if (!(where.type || typeof where.openHouseId !== 'undefined')) {
      return await Feed.find(filter);
    }

    const favoriteFeedSearch = new FavoriteFeedSearch(app.dataSources.postgres.connector, app);

    let idsSearchFilter = {
      where: {
        userId,
        feed: {
          ...where
        }
      },
      limit: filter.limit,
      offset: filter.offset
    };

    let ids = await favoriteFeedSearch.query(idsSearchFilter).map(f => f.feedId);

    if (!ids.length) {
      return [];
    }

    delete filter.where.type;
    delete filter.limit;
    delete filter.offset;
    filter.where = {id: {inq: ids}};

    return await Feed.find(filter);
  };
};
