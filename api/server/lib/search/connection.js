'use strict';

import BaseSearchController from './index';
const debug = require('debug')('spiti:feed:search');

const FULL_TEXT_SEARCH_FIELDS = ['userName', 'brokerage'];

// TODO: refactor search
export default class ConnectionSearch extends BaseSearchController {
  constructor(connector, app, options = {}) {
    super(connector, app, options);

    this.fulltextSearchFields = options.fulltextSearchFields || FULL_TEXT_SEARCH_FIELDS;
  }

  buildAdditionalWhereQuery() {
    let query = '';
    let { where } = this.filter;

    if (where && where.account && where.account.searchString) {
      query +=  ` ${this._getJoinKey()}`;
      query += ` ("account"."userName" iLike $${this.replacements.length + 1}`;
      query += ` OR "account"."brokerage" iLike $${this.replacements.length + 1})`;

      this.replacements.push(`%${where.account.searchString}%`);
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

    let accountIncludeQuery = `
      json_build_object( \
        'id', "account"."userId", \
        'firstName', "account"."firstName", \
        'lastName', "account"."lastName", \
        'userName', "account"."userName", \
        'brokerage', "account"."brokerage", \
        'avatar', json_build_object( \
          'id', "avatar"."id", \
          'publicUrl', "avatar"."publicUrl", \
          'name', "avatar"."name", \
          'sizes', "avatar"."sizes" \
        ) \
      ) AS "account" `;

    return `
      SELECT "${tableKey}".*,
             ${include.includes('account') ? accountIncludeQuery : ''}
      FROM (${query}) AS "${tableKey}"
      LEFT JOIN "spiti"."user" AS "user" ON "user"."id" = "${this.baseModel.tableKey}"."userId"
      ${include.includes('account') ? this._includeAccount() : ''}
    `;
  }

  _includeAccount() {
    return `
      LEFT JOIN "spiti"."account" AS "account" ON "account"."userId" = "${this.baseModel.tableKey}"."connectedId"
      LEFT JOIN "spiti"."attachment" AS "avatar" ON "avatar"."id" = "account"."avatarId"
    `;
  }
};
