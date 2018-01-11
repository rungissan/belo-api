'use strict';

import BaseSearchController from './index';
const debug = require('debug')('spiti:feed:search');

const FULL_TEXT_SEARCH_FIELDS = ['message'];
const FIELDS = ['userId', 'type', 'username', 'phone', 'about', 'biography', 'brokerage'];

export default class ChatMessageSearch extends BaseSearchController {
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

    return `SELECT "${tableKey}".*
      ${include.includes('account') ? this._includeAccountSelect() : ''}
      FROM (${query}) AS "${tableKey}"
      ${include.includes('account') ? this._includeAccountJoin() : ''}
    `;
  }

  _includeAccountSelect() {
    return `, json_build_object(
      'id', "account"."userId",
      'firstName', "account"."first_name",
      'lastName', "account"."last_name",
      'username', "account"."username",
      'brokerage', "account"."brokerage",
      'avatar', json_build_object(
        'id', "avatar".id,
        'public_url', "avatar".public_url,
        'name', "avatar".name,
        'sizes', "avatar".sizes
      )
    ) AS "account"`;
  }

  _includeAccountJoin() {
    return `LEFT JOIN "spiti"."account" AS "account" ON "account"."userId" = "${this.baseModel.tableKey}"."userId"
      LEFT JOIN "spiti"."attachment" AS "avatar" ON "avatar"."id" = "account"."avatar_id"
    `;
  }
};
