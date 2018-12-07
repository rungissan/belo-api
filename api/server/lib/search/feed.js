'use strict';

import BaseSearchController from './index';

const debug = require('debug')('spiti:feed:search');

export default class FeedSearch extends BaseSearchController {
  constructor(connector, app, options = {}) {
    super(connector, app, options);
  }

  // TODO: Refactor include queries
  _buildIncludesQuery(query) {
    const { searchFeed,  include, where: { feedOptions }  }  = this.filter;

    let noFee = false,
      isAvailable = false,
      isRecentlySold = false,
      isRecentlyRented = false,
      hasOwner = false;

    if (feedOptions) {
      noFee = feedOptions.noFee;
      hasOwner = feedOptions.byOwner;
      isAvailable = feedOptions.isAvailable;
      isRecentlySold = feedOptions.isRecentlySold;
      isRecentlyRented = feedOptions.isRecentlyRented;
    }

    debug('Build include query', include);

    if (!(include && include.length)) {
      return query;
    }

    let tableKey = this.baseModel.tableKey;

    let favoriteIncludeQuery = ', "favoriteFeed"."id" IS NOT NULL AS "isFavorite"';
    let isFollowedIncludeQuery = include.includes('followed') ? ", 'isFollowed', \"followed\".\"id\" IS NOT NULL" : '';
    let accountIncludeQuery = `
      , json_build_object(
        'id', "account"."userId",
        'firstName', "account"."firstName",
        'lastName', "account"."lastName",
        'userName', "account"."userName",
        'phone', "account"."phone",
        'brokerage', "account"."brokerage",
        'avatar', json_build_object(
          'id', "accountAvatar".id,
          'publicUrl', "accountAvatar"."publicUrl",
          'name', "accountAvatar".name,
          'sizes', "accountAvatar".sizes
        )
        ${isFollowedIncludeQuery}
      ) AS "account"
    `;

    return `
      SELECT "${tableKey}".*
             ${include.includes('image') ? ', row_to_json("image".*) AS "image"' : ''}
             ${include.includes('additionalImages') ? ', "additionalImages"' : ''}
             ${include.includes('geolocations') ? ', geolocations' : ''}
             ${include.includes('feedOptions') ? ', row_to_json("feedOptions".*) AS "feedOptions"' : ''}
             ${include.includes('openHouse') ? ', row_to_json("openHouse".*) AS "openHouse"' : ''}
             ${include.includes('account') ? accountIncludeQuery : ''}
             ${include.includes('isFavorite') && this.userOptions.userId ? favoriteIncludeQuery : ''}
      FROM (${query}) AS "${tableKey}"
      ${include.includes('image') ? this._includeImage() : ''}
      ${include.includes('additionalImages') ? this._includeAdditionalImages() : ''}
      ${include.includes('geolocations') ? this._includeGeolocations() : ''}
      ${include.includes('feedOptions') ? this._includeFeedOptions() : ''}
      ${include.includes('openHouse') ? this._includeOpenHouse() : ''}
      ${include.includes('account') ? this._includeAccount() : ''}
      ${include.includes('isFavorite') && this.userOptions.userId ? this._includeIsFavorite() : ''}
      ${include.includes('followed') && this.userOptions.userId ? this._includeIsFollowed() : ''}
      ${this._addOrder(searchFeed, isRecentlySold, isRecentlyRented, noFee, hasOwner) }
     
    `;
  }

  _addOrder(searchFeed, recentlySold, recentlyRented, noFee, hasOwner) {
    const isFee = noFee ? '"Feed"."noFee" = true' : '',
      isListedByOwner = hasOwner ? '"Feed"."hasOwner" = true' : '';

    let query = Boolean(recentlySold || recentlyRented) ? ' ORDER BY "Feed"."sold_at" IS NULL ASC, "Feed"."sold_at" DESC' :
             Boolean(searchFeed || isFee || isListedByOwner) ? ' ORDER BY "Feed"."updated_at" DESC' : ' ORDER BY "Feed"."created_at" DESC';
    return query;
  }

  buildAdditionalWhereQuery() {
    const { where: { feedOptions }  }  = this.filter;

    let
      noFee = false,
      avaliable = false,
      recentlySold  = false,
      recentlyRented = false,
      hasOwner = false;

    if (feedOptions) {
      noFee = feedOptions.noFee;
      hasOwner = feedOptions.byOwner;
      avaliable = feedOptions.isAvailable;
      recentlySold  = feedOptions.isRecentlySold;
      recentlyRented = feedOptions.isRecentlyRented;
    }

    const
      isAvalible = avaliable ? '"Feed"."feedStatus" = 0' : '',
      isSold = recentlySold  ? '"Feed"."feedStatus" = 1' : '',
      isRented = recentlyRented ? '"Feed"."feedStatus" = 2' : '',
      isFee = noFee ? '"Feed"."noFee" = true' : '',
      isListedByOwner = hasOwner ? '"Feed"."hasOwner" = true' : '',
      arrayOfQuery = [isSold, isRented, isFee, isListedByOwner];

    let query = arrayOfQuery.reduce((prev, curr) => {
      if (!prev) return curr;
      if (!curr) return prev;
      return  `${prev} OR ${curr}`;
    });
    if (query)  query = ` AND ( ${query})`;
    query = avaliable ? query + ` AND ${isAvalible}` : query;

    if (feedOptions && feedOptions.propertyFeatures) {
      query += this._buildAdditionalWhereQueryForJSON(feedOptions.propertyFeatures, 'propertyFeatures');
    }
    if (feedOptions && feedOptions.keyDetails) {
      query += this._buildAdditionalWhereQueryForJSON(feedOptions.keyDetails, 'keyDetails');
    }
    return query;
  }

  _buildAdditionalWhereQueryForJSON(feature, name) {
    return Object.keys(feature).reduce((query, key) => {
      return (typeof(feature[key]) == 'string') ? query + ` AND ("feedOptions"."${name}"->>'${key}' ='${feature[key]}' )` :
      query + ` AND ("feedOptions"."${name}"->>'${key}')::boolean`;
    }, '');
  }

  _includeAdditionalImages() {
    return `
    LEFT JOIN LATERAL (
      SELECT
        json_agg("addImage") AS "additionalImages"
      FROM "spiti"."attachment_to_feed" AS "attachment_to_feed"
        INNER JOIN "spiti"."attachment" AS "addImage" ON "addImage"."id" = "attachment_to_feed"."attachmentId"
          AND "attachment_to_feed"."feedId" = "${this.baseModel.tableKey}"."id"
    ) "additionalImages" ON true
    `;
  }

  _includeGeolocations() {
    return `
    LEFT JOIN LATERAL (
      SELECT
        json_agg("geolocation") AS "geolocations"
      FROM "spiti"."geolocation_to_feed" AS "geolocation_to_feed"
        INNER JOIN "spiti"."geolocation" AS "geolocation" ON "geolocation"."id" = "geolocation_to_feed"."geolocationId"
          AND "geolocation_to_feed"."feedId" = "${this.baseModel.tableKey}"."id"
    ) "geolocations" ON true
    `;
  }

  _includeImage() {
    return `
      LEFT JOIN "spiti"."attachment" AS "image" ON "image"."id" = "${this.baseModel.tableKey}"."imageId"
    `;
  }

  _includeFeedOptions() {
    return `
      LEFT JOIN "spiti"."feed_options" AS "feedOptions"
        ON "feedOptions"."feedId" = "${this.baseModel.tableKey}"."id"
    `;
  }

  _includeOpenHouse() {
    return `
      LEFT JOIN "spiti"."open_house" AS "openHouse"
        ON "openHouse"."feedId" = "${this.baseModel.tableKey}"."id"
    `;
  }

  _includeAccount() {
    return `
      LEFT JOIN "spiti"."account" AS "account"
        ON "account"."userId" = "${this.baseModel.tableKey}"."userId"
      LEFT JOIN "spiti"."attachment" AS "accountAvatar"
        ON "accountAvatar"."id" = "account"."avatarId"
    `;
  }

  _includeIsFavorite() {
    return `
      LEFT JOIN "spiti"."favorite_feed" AS "favoriteFeed"
        ON "favoriteFeed"."userId" = ${this.userOptions.userId}
        AND "favoriteFeed"."feedId" = "${this.baseModel.tableKey}"."id"
    `;
  }

  _includeIsFollowed() {
    return `
      LEFT JOIN "spiti"."followed" AS "followed"
        ON "followed"."userId" = ${this.userOptions.userId}
        AND "followed"."followedId" = "${this.baseModel.tableKey}"."userId"
    `;
  }
};
