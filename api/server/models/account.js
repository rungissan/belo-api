'use strict';

import Promise from 'bluebird';
import path from 'path';

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

  Account.validateAsync('userName', function(throwError, done) {
    let accountToModify = this;

    if (accountToModify.type !== 'user') {
      return done();
    }

    if (!accountToModify.userName || accountToModify.userName == '') {
      throwError();
      return done();
    }

    const filter = {
      userName: { ilike: accountToModify.userName },
      userId: {
        neq: accountToModify.userId
      }
    };

    Account.findOne({
      where: filter
    }, (err, accountFound) => {
      if (err) {
        throwError();
        return done();
      }

      if (!accountFound) return done();
      if (accountFound.id !== accountToModify.id) {
        throwError();
      }

      done();
    });
  }, {
    message: 'userName already exists',
    code: 'uniqueness'
  });

  Account.validateAsync('brokerage', function(throwError, done) {
    let accountToModify = this;

    if (accountToModify.type !== 'prof') {
      return done();
    }

    if (!accountToModify.brokerage || accountToModify.brokerage == '') {
      throwError();
      return done();
    }

    const filter = {
      brokerage:{
        ilike: accountToModify.brokerage
      },
      userId: {
        neq: accountToModify.userId
      }
    };

    Account.findOne({
      where: filter
    }, (err, accountFound) => {
      if (err) {
        throwError();
        return done();
      }

      if (!accountFound) return done();
      if (accountFound.id !== accountToModify.id) throwError();

      done();
    });
  }, {
    message: 'brokerage already exists',
    code: 'uniqueness'
  });

  Account.afterRemote('findById', includeCountsAndGeo);
  Account.afterRemote('prototype.getFavoriteFeeds', includeCounters);

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
      Geolocation,
      StatusCheck
    } = Account.app.models;

    const areaOfServices = await GeolocationToAccount.find({
      where: { userId: instance.userId }
    });
    if (areaOfServices.length) {
      const areaIds = [];
      areaOfServices.forEach(geo => areaIds.push({ id: geo.geolocationId }));
      const geos = await Geolocation.find({ where: { or: areaIds } });
      queries.areaOfServices = [...geos];
    } else {
      queries.areaOfServices = [];
    }

    if (populate.includes('followersCount')) {
      queries.followersCount = Followed.count({ followedId: instance.userId });
    }
    if (populate.includes('followedCount')) {
      queries.followedCount = Followed.count({ userId: instance.userId });
    }
    queries.statusCheckCount = StatusCheck.count({listingOwnerId: instance.userId, status: 0});
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
    let { Feed, FavoriteFeed, Followed } = app.models;
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
    filter.include = [...filter.include, [{relation: 'account', scope: { include: ['avatar']}}]];

    const result = await Feed.find(filter);

    if (result && result.length) {
      const JSResult = result.map(item => item.toJSON());
      const accIds = [];
      JSResult.forEach(item => {
        item.isFavorite = true;
        accIds.push({
          userId,
          followedId: item.userId
        });
      });
      const followedUsers = await Followed.find({
        where: { or: accIds }
      });
      JSResult.forEach(listing => {
        listing.account.isFollowed = false;
        followedUsers.forEach(user => {
          if (user && user.followedId === listing.userId) {
            listing.account.isFollowed = true;
          }
        });
      });
      return JSResult;
    }
    return result;
  };

  Account.search = async function(ctx, filter = {}) {
    const token = ctx.req.accessToken;
    const userId = token && token.userId;
    let where = filter.where || {};

    const clientSearch = new ClientSearch(Account.app.dataSources.postgres.connector, Account.app, {baseModelName: 'Account'});

    let query = {
      where: {
        searchString: where.searchString
      },
      include: ['avatar', 'followed'],
      limit: filter.limit,
      offset: filter.offset
    };

    switch (where.onlyAccountType) {
      case 'all': break;
      case 'user':
        query.where.type = 'user';
        break;
      case 'prof':
      default:
        query.where.type = 'prof';
    }
    where.geolocations && (query.where.geolocations = where.geolocations);
    const result = await clientSearch.query(query, {userId: userId});
    const formatedResult = await formatSearchResult(result, userId);
    return  formatedResult;
  };

  const formatSearchResult = async (result, userId) => {
    const {
      Connection
    } = Account.app.models;

    const connectionStatus = await Connection.find({
      where: { userId: userId }
    }).reduce((result, item) => {
      result[item.connectedId] = item.status;
      return result;
    }, {});

    result.forEach(item => {
      item.connectionStatus =  connectionStatus[item.userId];
    });
    return result;
  };

  Account.prototype.getOwnSortedOpenHouses = async function(filter) {
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
        "feed".*,
        "open_house".*,
        "feed"."id" AS "feedId",
        "openHouseId" AS "openHouseId",
        json_build_object( 
             'userId', "account"."userId",
            'firstName', "account"."firstName", 
            'lastName', "account"."lastName", 
            'userName', "account"."userName", 
            'brokerage', "account"."brokerage", 
                'avatar', json_build_object(
                'id', "avatar"."id", 
                'publicUrl', "avatar"."publicUrl", 
                'name', "avatar"."name", 
                'sizes', "avatar"."sizes"  ) 
      ) AS "account" 
      FROM "spiti"."feed"
      JOIN "spiti"."open_house" ON "openHouseId" = "spiti"."open_house"."id"
      LEFT JOIN "spiti"."account" AS "account" ON "feed"."userId" = "account"."userId"
      LEFT JOIN "spiti"."attachment" AS "avatar" ON "avatar"."id" = "account"."avatarId"
      WHERE "spiti"."feed"."userId" = $1
        AND "spiti"."feed"."type" = 'openHouse'
        AND "spiti"."feed"."deleted_at" IS NULL
      ORDER BY "spiti"."open_house"."date"
      LIMIT ${limit}
      OFFSET ${offset};
    `;

    const search = new Search(Account.app.dataSources.postgres.connector, Account.app, { raw: true });
    const openHouses = await search.rawQuery(ownQuery, [this.userId]);

    if (openHouses && openHouses.length) {
      const formatedOpenHouses = await this.formatOpenHouse(openHouses);
      return formatedOpenHouses;
    } else {
      return [];
    }
  };

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

  Account.prototype.getFavoriteSortedOpenHouses = async function(filter) {
    const limit = filter.limit || 9;
    const offset = filter.offset || 0;
    const {
      FavoriteFeed
    } = Account.app.models;
    const favoriteFeedsIds = await FavoriteFeed.find({
      where: { userId: this.userId }
    }).map(item => item.feedId);
    if (!favoriteFeedsIds.length) {
      return [];
    }
    const ownQuery = `
      SELECT 
        "feed".*,
        "open_house".*,
        "feed"."id" AS "feedId",
        "openHouseId" AS "openHouseId",
         json_build_object( 
             'userId', "account"."userId",
            'firstName', "account"."firstName", 
            'lastName', "account"."lastName", 
            'userName', "account"."userName", 
            'brokerage', "account"."brokerage", 
                'avatar', json_build_object(
                'id', "avatar"."id", 
                'publicUrl', "avatar"."publicUrl", 
                'name', "avatar"."name", 
                'sizes', "avatar"."sizes"  ) 
      ) AS "account" 
      FROM "spiti"."feed"
      JOIN "spiti"."open_house" ON "openHouseId" = "spiti"."open_house"."id"
      LEFT JOIN "spiti"."account" AS "account" ON "feed"."userId" = "account"."userId"
      LEFT JOIN "spiti"."attachment" AS "avatar" ON "avatar"."id" = "account"."avatarId"
      WHERE "spiti"."feed"."type" = 'openHouse'
      AND "feedId" in (${favoriteFeedsIds}) AND "spiti"."feed"."deleted_at" IS NULL 
      ORDER BY "spiti"."open_house"."date"
      LIMIT ${limit}
      OFFSET ${offset};
    `;

    const search = new Search(Account.app.dataSources.postgres.connector, Account.app, { raw: true });
    const openHouses = await search.rawQuery(ownQuery);
    if (openHouses && openHouses.length) {
      const formatedOpenHouses = await this.formatOpenHouse(openHouses);
      return formatedOpenHouses;
    } else {
      return [];
    }
  };

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

  Account.prototype.formatOpenHouse = async function(openHouses) {
    const {
      GeolocationToFeed,
      Geolocation,
      Attachment,
      AttachmentToOpenHouse,
      FeedOptions,
      Followed
    } = Account.app.models;

    const followedIds = await Followed.find({
      where: { userId: this.userId }
    }).map(item => item.followedId);

    const geosToFeed = await GeolocationToFeed.find({
      where: { or: openHouses.map(item => { return { feedId: item.feedId }; }) }
    });
    const feedOptions = await FeedOptions.find({
      where: { or: openHouses.map(item => { return { feedId: item.feedId }; }) }
    });
    const attToOh = await AttachmentToOpenHouse.find({
      where: { or: openHouses.map(item => { return { openHouseId: item.openHouseId }; }) }
    });
    const att = await Attachment.find({
      where: { or: attToOh.map(item => { return { id: item.attachmentId }; })}
    });
    let geos;
    if (geosToFeed && geosToFeed.length) {
      geos = await Geolocation.find({
        where: { or: geosToFeed.map(item => { return { id: item.geolocationId }; })}
      });
    } else {
      geos = [];
    }
    const mainImage = await Attachment.find({
      where: { or: openHouses.map(item => { return { id: item.imageId }; }) }
    });
    openHouses.forEach(oh => {
      oh.account.isFollowed = followedIds.includes(oh.account.userId) ? true : false;
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
        userId: oh.userId,
        created_at: oh.created_at,
        deleted_at: oh.deleted_at,
        updated_at: oh.updated_at
      };
      feedOptions.forEach(fo => {
        if (fo.feedId === oh.id) {
          oh.feedOptions = fo;
        }
      });
      mainImage.forEach(mi => {
        if (oh.imageId === mi.id) {
          oh.image = mi;
        }
      });
      attToOh.forEach(ato => {
        att.forEach(at => {
          if (oh.openHouseId === ato.openHouseId && ato.attachmentId === at.id) {
            oh.openHouse.images.unshift(at);
          }
        });
      });
      geosToFeed.forEach(gtf => {
        geos.forEach(geo => {
          if (oh.id === gtf.feedId && gtf.geolocationId === geo.id) {
            oh.geolocations.push(geo);
          }
        });
      });
      oh.feedId = undefined;
      oh.contactPhone = undefined;
      oh.date = undefined;
      oh.feedId = undefined;
      oh.host = undefined;
      oh.timeEnd = undefined;
      oh.timeStart = undefined;
      oh.created_at = undefined;
      oh.deleted_at = undefined;
      oh.updated_at = undefined;
    });
    return openHouses;
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

    const {
      Attachment,
      Connection,
      Followed,
      GeolocationToAccount,
      Geolocation
    } = Account.app.models;

    const areaOfServices = await GeolocationToAccount.find({
      where: { userId: account.userId }
    });
    if (areaOfServices.length) {
      const areaIds = [];
      areaOfServices.forEach(geo => areaIds.push({ id: geo.geolocationId }));
      const geos = await Geolocation.find({ where: { or: areaIds } });
      account.areaOfServices = [...geos];
    } else {
      account.areaOfServices = [];
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
  Account.prototype.setGeolocation = async function(geolocations) {
    try {
      const { userId } = this;

      if (!geolocations.length) {
        const err = {};
        err.status = 422;
        throw err;
      }
      if (!this.userId) {
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
      throw err;
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

  async function includeCounters(ctx) {
    const token = ctx.req.accessToken;
    const userId = token && token.userId;
    let results = ctx.result;
    let ds = Account.app.dataSources.postgres;
    let replacements = [];

    if (!(userId && results && results.length)) {
      return;
    }

    let filter = ctx.args && ctx.args.filter || {};

    if (!(filter && filter.where && filter.offset == 0 && filter.where.type == 'listing')) {
      return;
    }

    const query = `SELECT sum(case when "rentType" = 'rent' then 1 else 0 end) as rent,
                   sum(case when "rentType" = 'sale' then 1 else 0 end) as sale,
                   sum(case when "feedStatus" = 0 then 1 else 0 end) as available from "spiti"."feed" AS "Feed"
                  LEFT JOIN "spiti"."feed_options" AS "feedOptions" ON "feedOptions"."feedId" = "Feed"."id"
                  WHERE "Feed"."userId" = $1 AND "Feed"."type" = 'listing' AND "Feed". "deleted_at" Is NULL`;
    replacements.push(userId);
    let counts = await new Promise(
      (resolve, reject) => {
        ds.connector.execute(query, replacements, (err, data) => {
          if (err) {
            console.log(err);
            let error = new Error('Error occured');
            return reject(error);
          }
          return resolve(data[0]);
        });
      });

    results.forEach(feed => feed.counts = counts);
    ctx.result = results;
    return;
  };

  Account.sendBanRequest = async function(ctx, data) {
    const token = ctx.req.accessToken;
    const userId = token && token.userId;
    if (!userId) {
      throw errAccessDenied();
    }

    let account = await Account.findOne({
      where: {userId}
    });
    console.log(account);
    let kueJobs = Account.app.kueJobs;
    let opt = {	user_req_id:	account.userId,
                user_req_type: account.type,
                user_req_firstName: account.firstName,
                user_req_lastName: account.lastName,
                user_req_userName: account.userName,
                user_req_brokerage: account.brokerage,
                title:"What is the indicated sign?",
                ImageLink: "/assets/images/dummy.jpg"
                   
              }
    
    console.log(opt);
    let renderer = Account.app.loopback.template(path.resolve(__dirname, '../views/ban-request.ejs'));
 
  
    let options = {
      type: 'email',
      to: 'yury@samoshk.in',
      from: 'test@domain.com',
      subject: 'Ban request.',
      html: renderer(opt),
      user: 'abuser'
    };

    kueJobs.createJob('sendEmail', options);
    return;

  }

  Account.remoteMethod(
    'sendBanRequest',
    {
      description: 'Send ban request',
      accepts: [{
        arg: 'ctx',
        type: 'object',
        http: {
          source: 'context'
        }
      },
      {
        arg: 'data',
        type: 'object',
        required: true,
        http: {
          source: 'body'
        }
      }
      ],
      returns: [{
        arg: 'data',
        type: 'Object',
        root: true
      }],
      returns: { arg: 'data', type: 'object', root: true},
      http: { verb: 'post', path: '/send-ban-request' }
    }
  );
};
