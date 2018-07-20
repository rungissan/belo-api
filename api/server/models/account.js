'use strict';

import Promise from 'bluebird';

import Search from '../lib/search';
import ClientSearch from '../lib/search/client';
import { errAccessDenied } from '../lib/errors';

const FEED_COUNT_TYPES = {
  post: 'posts',
  listing: 'listings',
  openHouse: 'openHouses'
};

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

  delete Account.validations.userName;
  Account.validatesUniquenessOf('userName', {
    message: 'Username already exists',
    scopedTo: ['realm'],
    ignoreCase: true
  });

  Account.afterRemote('findById', includeCountsAndGeo);

  function formatFeedCounts(rows) {
    let counts = {
      posts: 0,
      listings: 0,
      openHouses: 0
    };

    if (!(rows && rows.length)) {
      return counts;
    }

    rows.forEach(row => {
      if (row && row.count && FEED_COUNT_TYPES[row.type]) {
        counts[FEED_COUNT_TYPES[row.type]] = Number(row.count) || 0;
      }
    });

    return counts;
  }

  async function includeCountsAndGeo(ctx, instance) {
    if (!(instance && instance.userId)) {
      return;
    }

    let filter = ctx.args && ctx.args.filter || {};
    let populate = filter.populate;
    if (!Array.isArray(populate)) {
      return;
    }

    let queries = {};
    const { 
      Followed, 
      Feed, 
      GeolocationToAccount,
      Geolocation
    } = Account.app.models;

    const areaOfServices = await GeolocationToAccount.find({
      where: { userId: instance.userId }
    })
    if(areaOfServices.length){
      const areaIds = [];
      areaOfServices.forEach(geo => areaIds.push({ id: geo.geolocationId }))
      const geos = await Geolocation.find({ where: { or: areaIds } })
      queries.areaOfServices = [...geos]      
    } else {
      queries.areaOfServices = []
    }

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
          AND "feed"."deleted_at" IS NULL
        GROUP BY "feed"."type";
      `;

      let favoriteQuery = `
        SELECT "feed"."type", count(*)
        FROM "spiti"."favorite_feed" AS "FavoriteFeed"
        INNER JOIN "spiti"."feed" AS "feed" ON "feed"."id" = "FavoriteFeed"."feedId"
          AND "feed"."deleted_at" IS NULL
        WHERE "FavoriteFeed"."userId" = $1
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

  Account.prototype.getOwnSortedOpenHouses = async function(filter){

    const limit = filter.limit || 9;
    const offset = filter.offset || 0;
    const { 
      GeolocationToFeed,
      Geolocation,
      Attachment,
      AttachmentToOpenHouse,
      FeedOptions
    } = Account.app.models;

    const ownQuery = `
      SELECT 
        "feed"."id" AS "feedId",
        "openHouseId" AS "openHouseId",
        *
      FROM "spiti"."feed"
      JOIN "spiti"."open_house" ON "openHouseId" = "spiti"."open_house"."id"
      WHERE "spiti"."feed"."userId" = $1
        AND "spiti"."feed"."type" = 'openHouse'
        AND "spiti"."feed"."deleted_at" IS NULL
      ORDER BY "spiti"."open_house"."date"
      LIMIT ${limit}
      OFFSET ${offset};
    `;

    const search = new Search( Account.app.dataSources.postgres.connector, Account.app, { raw: true });
    const openHouses = await search.rawQuery(ownQuery, [this.userId]);

    if(openHouses && openHouses.length){
      const formatedOpenHouses = await this.formatOpenHouse(openHouses);
      return formatedOpenHouses;
    } else {
      return [];
    }
  }

  Account.remoteMethod(
    'prototype.getOwnSortedOpenHouses',
    {
      description: 'Get sorted by date open houses.',
      accepts: [
        { arg: 'filter', type: 'object', required: true }
      ],
      returns: { arg: 'data', type: 'Account', root: true },
      http: { verb: 'get', path: '/get-own-sorted-open-houses' }
    }
  );

  Account.prototype.getFavoriteSortedOpenHouses = async function(filter){

    const limit = filter.limit || 9;
    const offset = filter.offset || 0;
    const {
      FavoriteFeed
    } = Account.app.models;
    const favoriteFeedsIds = await FavoriteFeed.find({
      where: { userId: this.userId }
    });
    if(!favoriteFeedsIds.length){
      return [];
    }
    const ownQuery = `
      SELECT 
        "feed"."id" AS "feedId",
        "openHouseId" AS "openHouseId",
        *
      FROM "spiti"."feed"
      JOIN "spiti"."open_house" ON "openHouseId" = "spiti"."open_house"."id"
      WHERE "spiti"."feed"."userId" = $1
        ${favoriteFeedsIds.map((item, i) => {
          if(i === 0){
            return `AND "feedId" = ${item.feedId}`
          } else {
            return `OR "feedId" = ${item.feedId}`}
          }
        ).join(' ')}
        AND "spiti"."feed"."type" = 'openHouse'
        AND "spiti"."feed"."deleted_at" IS NULL
      ORDER BY "spiti"."open_house"."date"
      LIMIT ${limit}
      OFFSET ${offset};
    `;

    const search = new Search( Account.app.dataSources.postgres.connector, Account.app, { raw: true });
    const openHouses = await search.rawQuery(ownQuery, [this.userId]);

    if(openHouses && openHouses.length){
      // return ['zatichka']
      const formatedOpenHouses = await this.formatOpenHouse(openHouses);
      return formatedOpenHouses;
    } else {
      return []
    }
  }

  Account.remoteMethod(
    'prototype.getFavoriteSortedOpenHouses',
    {
      description: 'Search by feed criterion.',
      accepts: [
        {arg: 'filter', type: 'object', required: true}
      ],
      returns: { arg: 'data', type: 'Array', root: true},
      http: {verb: 'get', path: '/get-favorite-sorted-open-houses'}
    }
  );

  Account.prototype.formatOpenHouse = async function(openHouses){
    const { 
      GeolocationToFeed,
      Geolocation,
      Attachment,
      AttachmentToOpenHouse,
      FeedOptions
    } = Account.app.models;
    const geosToFeed = await GeolocationToFeed.find({
      where: { or: openHouses.map(item => { return { feedId: item.feedId } }) }
    })
    const feedOptions = await FeedOptions.find({
      where: { or: openHouses.map(item => { return { feedId: item.feedId } }) }
    })
    const attToOh = await AttachmentToOpenHouse.find({
      where: { or: openHouses.map(item => { return { openHouseId: item.openHouseId } }) }
    })
    const att = await Attachment.find({
      where: { or: attToOh.map(item => { return { id: item.attachmentId } })}
    })
    let geos;
    if(geosToFeed && geosToFeed.length){
      geos = await Geolocation.find({
        where: { or: geosToFeed.map(item => { return { id: item.geolocationId } })}
      })
    } else {
      geos = [];
    }
    const mainImage = await Attachment.find({
      where: { or: openHouses.map(item => { return { id: item.imageId } }) }
    })
    openHouses.forEach(oh => {
      oh.geolocations = [];
      oh.additionalImages = [];
      oh.image = {};
      oh.feedOptions = {};
      oh.id = oh.feedId;
      oh.openHouse = {
        contactPhone: oh.contactPhone,
        date: oh.date,
        feedId: oh.feedId,
        host: oh.host,
        id: oh.openHouseId,
        images: [],
        timeEnd: oh.timeEnd,
        timeStart: oh.timeStart,
        userId: oh.userId
      }
      feedOptions.forEach(fo => {
        if(fo.feedId === oh.id){
          oh.feedOptions = fo
        }
      })
      mainImage.forEach(mi => {
        if(oh.imageId === mi.id){
          oh.image = mi
        }
      })
      attToOh.forEach(ato => {
        att.forEach(at => {
          if(oh.openHouseId === ato.openHouseId && ato.attachmentId === at.id){
            oh.openHouse.images.unshift(at);
          }
        })
      })
      geosToFeed.forEach(gtf => {
        geos.forEach(geo => {
          if(oh.id === gtf.feedId && gtf.geolocationId === geo.id){
            oh.geolocations.push(geo);
          }
        })
      })
      oh.feedId = undefined;
      oh.contactPhone = undefined;
      oh.date = undefined;
      oh.feedId = undefined;
      oh.host = undefined;
      oh.timeEnd = undefined;
      oh.timeStart = undefined;
    })
    return openHouses
  }

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

    const { 
      Attachment,
      Connection,
      Followed,
      GeolocationToAccount,
      Geolocation
    } = Account.app.models;

    const areaOfServices = await GeolocationToAccount.find({
      where: { userId: account.userId }
    })
    if(areaOfServices.length){
      const areaIds = [];
      areaOfServices.forEach(geo => areaIds.push({ id: geo.geolocationId }))
      const geos = await Geolocation.find({ where: { or: areaIds } })
      account.areaOfServices = [...geos]      
    } else {
      account.areaOfServices = []
    }

    let ownQuery = `
      SELECT "feed"."type", count(*)
      FROM "spiti"."feed" AS "feed"
      WHERE "feed"."userId" = $1
        AND "feed"."deleted_at" IS NULL
      GROUP BY "feed"."type";
    `;
    
    const search = new Search(Account.app.dataSources.postgres.connector, Account.app, {raw: true});

    let props = {
      followersCount: Followed.count({ followedId: account.userId }),
      followedCount: Followed.count({ userId: account.userId }),
      connection: Connection.findOne({
        where: {
          userId,
          connectedId: account.userId
        }
      }),
      ownFeedCounters: search.rawQuery(ownQuery, [accountId]).then(formatFeedCounts)
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
  Account.prototype.setGeolocation = async function(geolocations){
    try {

      const { userId } = this; 

      if(!geolocations.length){
        const err = {};
        err.status = 422;
        throw err;
      }
      if(!this.userId){
        const err = {};
        err.status = 401;
        throw err;
      }
      const { GeolocationToAccount } = Account.app.models;

      let presentedLocations;
      await GeolocationToAccount.destroyAll({ userId });

      geolocations.forEach(async geolocationId => {
        const createdGeo = await GeolocationToAccount.findOrCreate({
          where: { 
            userId: this.userId,
            geolocationId
          }
        }, {
            userId: this.userId,
            geolocationId
        });
      });

      return {
        status: 200,
        message: 'updated'
      };
    } catch (err) {
      throw err
    }
  };
  Account.remoteMethod(
    'prototype.setGeolocation',
    {
      description: 'Set new / update users own geolocation.',
      accepts: [
        { arg: 'geolocations', type: 'array', required: true }
      ],
      returns: { arg: 'data', type: 'Account', root: true},
      http: { verb: 'post', path: '/user-geolocation' }
    }
  );
};
