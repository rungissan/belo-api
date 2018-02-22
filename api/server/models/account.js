'use strict';

import Promise from 'bluebird';

import Search from '../lib/search';
import ClientSearch from '../lib/search/client';
import { errAccessDenied } from '../lib/errors';

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

  function formatFeedCounts(rows) {
    let counts = {
      post: 0,
      listing: 0,
      openHouse: 0
    };

    if (!(rows && rows.length)) {
      return counts;
    }

    rows.forEach(row => {
      if (row && row.count && row.type) {
        counts[row.type] = Number(row.count) || 0;
      }
    });

    return counts;
  }

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
    const { Followed, Feed } = Account.app.models;

    if (populate.includes('followersCount')) {
      queries.followersCount = Followed.count({ followedId: instance.userId });
    }
    if (populate.includes('followedCount')) {
      queries.followedCount = Followed.count({ userId: instance.userId });
    }
    if (populate.includes('feedCounts')) {
      let ownQuery = `
        SELECT "feed"."type", count(*)
        FROM "spiti"."feed" AS "feed"
        WHERE "feed"."userId" = $1
        GROUP BY "feed"."type";
      `;

      let favoriteQuery = `
        SELECT "feed"."type", count(*)
        FROM "spiti"."favorite_feed" AS "FavoriteFeed"
        INNER JOIN "spiti"."feed" AS "feed" ON "feed"."id" = "FavoriteFeed"."feedId"
          AND "feed"."deleted_at" IS NULL WHERE "FavoriteFeed"."userId" = $1
        GROUP BY "feed"."type";
      `;

      const search = new Search(Feed.app.dataSources.postgres.connector, Feed.app, {raw: true});

      queries.ownFeedCounters = search.rawQuery(ownQuery, [instance.userId]).then(formatFeedCounts);
      queries.favoriteFeedCounters = search.rawQuery(favoriteQuery, [instance.userId]).then(formatFeedCounts);
    }

    if (Object.keys(queries).length === 0) {
      return;
    }

    let props = await Promise.props(queries);

    Object.keys(props).forEach(key => {
      ctx.result[key] = props[key];
    });

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

  async function searchFavoriteFeeds(app, userId, filter = {}) {
    let { Feed, FavoriteFeed } = app.models;
    filter.where = filter.where || {};
    let where = filter.where;

    const favoriteFeedSearch = new Search(app.dataSources.postgres.connector, app, {baseModelName: 'FavoriteFeed'});

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

  Account.search = async function(ctx, filter = {}) {
    const token = ctx.req.accessToken;
    const userId = token && token.userId;
    let where = filter.where || {};

    const clientSearch = new ClientSearch(Account.app.dataSources.postgres.connector, Account.app, {baseModelName: 'Account'});

    let query = {
      where: {
        type: 'prof',
        searchString: where.searchString
      },
      include: ['avatar', 'followed'],
      limit: filter.limit,
      offset: filter.offset
    };
    where.geolocations && (query.where.geolocations = where.geolocations);

    return await clientSearch.query(query, {userId: userId});
  };

  Account.remoteMethod(
    'search',
    {
      description: 'Search by feed criterion.',
      accepts: [
        {arg: 'ctx',    type: 'object', http: { source: 'context' }},
        {arg: 'filter', type: 'object', required: true}
      ],
      returns: { arg: 'filters', type: 'Array', root: true},
      http: {verb: 'get', path: '/search'}
    }
  );

  Account.preview = async function(ctx, accountId) {
    const token = ctx.req.accessToken;
    const userId = token && token.userId;
    if (!userId) {
      throw errAccessDenied();
    }

    let account = await Account.findById(accountId);

    if (!(account && account.type === 'prof')) {
      throw errAccessDenied();
    }

    let { Attachment, Connection, Followed } = Account.app.models;

    let props = {
      followersCount: Followed.count({ followedId: account.userId }),
      followedCount: Followed.count({ userId: account.userId }),
      connection: Connection.findOne({
        where: {
          userId,
          connectedId: account.userId
        }
      })
    };

    account.avatarId && (props.avatar = Attachment.findById(account.avatarId));
    account.backgroundId && (props.background = Attachment.findById(account.backgroundId));

    let accountProps = await Promise.props(props);

    account = account.toJSON();
    account = Object.assign(account, accountProps);

    return account;
  };

  Account.remoteMethod(
    'preview',
    {
      description: 'Get public account info.',
      accepts: [
        {arg: 'ctx', type: 'object', http: { source: 'context' }},
        {arg: 'id', type: 'number', required: true}
      ],
      returns: { arg: 'account', type: 'Account', root: true},
      http: {verb: 'get', path: '/preview/:id'}
    }
  );
};
