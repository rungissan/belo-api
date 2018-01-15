'use strict';

import BaseSearchController from './index';
const debug = require('debug')('spiti:feed:search');

const FULL_TEXT_SEARCH_FIELDS = ['firstName', 'lastName', 'userName'];
const FIELDS = ['userId', 'type', 'userName', 'phone', 'about', 'biography', 'brokerage'];

export default class ClientSearch extends BaseSearchController {
  constructor(connector, app, options = {}) {
    super(connector, app, options);

    this.fulltextSearchFields = options.fulltextSearchFields || FULL_TEXT_SEARCH_FIELDS;
  }

  buildAdditionalWhereQuery() {
    let query = '';
    let { where } = this.filter;

    if (where && where.searchString) {
      query +=  ` ${this._getJoinKey()}`;
      query += ' to_tsvector(';
      query += this.fulltextSearchFields.map(column => `"${column}"`).join(" || ' ' || ");
      query += `) @@ plainto_tsquery($${this.replacements.length + 1})`;

      this.replacements.push(where.searchString);
    }

    return query;
  }

  _buildIncludesQuery(query) {
    let include = this.filter.include;
    debug('Build include query', include);

    if (!(include && include.length)) {
      return query;
    }

    let tableKey = this.baseModel.tableKey;

    let isFollowedIncludeQuery = ', "followed"."id" IS NOT NULL AS "isFollowed"';

    return `
      SELECT ${FIELDS.map(f => `"${tableKey}"."${f}"`).join(', ')},
             "${tableKey}".firstName AS "firstName",
             "${tableKey}".lastName AS "lastName",
             "${tableKey}".licenseType AS "licenseType",
             "${tableKey}".license_state AS "licenseState",
             "${tableKey}".license_number AS "licenseNumber",
             "${tableKey}".license_expiration AS "licenseExpiration",
             "${tableKey}".avatarId AS "avatarId",
             "${tableKey}".backgroundId AS "backgroundId",
             "user"."email" AS "email"
             ${include.includes('avatar') ? ', row_to_json("avatar".*) AS "avatar"' : ''}
             ${include.includes('followed') && this.userOptions.userId ? isFollowedIncludeQuery : ''}
      FROM (${query}) AS "${tableKey}"
      LEFT JOIN "spiti"."user" AS "user" ON "user"."id" = "${this.baseModel.tableKey}"."userId"
      ${include.includes('avatar') ? this._includeAvatar() : ''}
      ${include.includes('followed') && this.userOptions.userId ? this._includeIsFollowed() : ''}
    `;
  }

  _includeAvatar() {
    return `
      LEFT JOIN "spiti"."attachment" AS "avatar" ON "avatar"."id" = "${this.baseModel.tableKey}"."avatarId"
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
