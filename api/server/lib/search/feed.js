'use strict';

import BaseSearchController from './index';

const debug = require('debug')('spiti:feed:search');

export default class FeedSearch extends BaseSearchController {
  constructor(connector, app, options = {}) {
    super(connector, app, options);
  }

  // TODO: Refactor include queries
  _buildIncludesQuery(query) {

    console.log(this.filter)
    const { include, searchFeed, available, recentlySold, recentlyRented } = this.filter;


    console.log(available)
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
   console.log("++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
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
      ${ this._addFilterByStatus(searchFeed, available, recentlySold, recentlyRented) }
     
    `;
  }

  _addFilterByStatus(searchFeed, avaliable, recentlySold, recentlyRented) {
    const isAvalible = avaliable ? '"Feed"."feedStatus" = 0' : '',
          isSold = recentlySold  ? '"Feed"."feedStatus" = 1' : '',
          isRented = recentlyRented ? '"Feed"."feedStatus" = 2' : '',
          arrayOfQuery = [ isAvalible, isSold, isRented ];

    let query = arrayOfQuery.reduce((prev, curr) => {
      if ( !prev ) return curr
      if ( !curr ) return prev
      return  `${prev} OR ${curr}`;
    });

    if ( query ) query = `WHERE ${query}`

    query += Boolean( recentlySold || recentlyRented ) ? ' ORDER BY "Feed"."sold_at" IS NULL ASC, "Feed"."sold_at" DESC' :
             searchFeed ? ' ORDER BY "Feed"."updated_at" DESC' : ' ORDER BY "Feed"."created_at" DESC'

    return query;
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
