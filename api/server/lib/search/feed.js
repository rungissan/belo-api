'use strict';

import BaseSearchController from './index';

const debug = require('debug')('spiti:feed:search');

export default class FeedSearch extends BaseSearchController {
  constructor(connector, app, options = {}) {
    super(connector, app, options);
  }

  _buildWhereQuery() {
    let { whereValues, baseModel } = this;
    let query = '';

    Object.keys(whereValues).forEach((tableKey, index) => {
      let feedType = this.filter.where && this.filter.where.feedType;
      let orQuery;
      if (tableKey == 'feedOptions' && (!feedType || feedType === 'post')) {
        orQuery = `"${baseModel.tableKey}"."type" = 'post'`;
      }
      query += this._buildWhereStrings(whereValues[tableKey], tableKey, index, orQuery);
    });

    return query;
  }

  // TODO: Refactor include queries
  _buildIncludesQuery(query) {
    let include = this.filter.include;
    debug('Build include query', include);

    if (!(include && include.length)) {
      return query;
    }

    let {feed, feedOptions, geolocations} = this.models;

    return `
      SELECT "${feed.tableKey}".*
             ${include.includes('image') ? ', "image"' : ''}
             ${include.includes('additionalImages') ? ', "additionalImages"' : ''}
             ${include.includes('geolocations') ? ', geolocations' : ''}
             ${include.includes('feedOptions') ? ', row_to_json("feedOptions".*) AS "feedOptions"' : ''}
             ${include.includes('openHouse') ? ', row_to_json("openHouse".*) AS "openHouse"' : ''}
      FROM (${query}) AS "${feed.tableKey}"
      ${include.includes('image') ? this._includeImage() : ''}
      ${include.includes('additionalImages') ? this._includeAdditionalImages() : ''}
      ${include.includes('geolocations') ? this._includeGeolocations() : ''}
      ${include.includes('feedOptions') ? this._includeFeedOptions() : ''}
      ${include.includes('openHouse') ? this._includeOpenHouse() : ''}
    `;
  }

  _includeAdditionalImages() {
    return `
    LEFT JOIN LATERAL (
      SELECT
        json_agg("addImage") AS "additionalImages"
      FROM "spiti"."attachment_to_feed" AS "attachment_to_feed"
        INNER JOIN "spiti"."attachment" AS "addImage" ON "addImage"."id" = "attachment_to_feed"."attachmentId"
          AND "attachment_to_feed"."feedId" = "feed"."id"
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
          AND "geolocation_to_feed"."feedId" = "feed"."id"
    ) "geolocations" ON true
    `;
  }

  _includeImage() {
    return `
    LEFT JOIN LATERAL (
      SELECT
        json_build_object('id', "attachment"."id") AS "image"
      FROM "spiti"."attachment" AS "attachment"
        WHERE "attachment"."id" = "feed"."imageId"
    ) "image" ON true
    `;
  }

  _includeFeedOptions() {
    return `
      LEFT JOIN "spiti"."feed_options" AS "feedOptions"
        ON "feedOptions"."feedId" = "feed"."id"
    `;
  }

  _includeOpenHouse() {
    return `
      LEFT JOIN "spiti"."open_house" AS "openHouse"
        ON "openHouse"."id" = "feed"."openHouseId"
    `;
  }
};
