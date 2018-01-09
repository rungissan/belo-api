'use strict';

import BaseSearchController from './index';
const debug = require('debug')('spiti:feed:search');

const FULL_TEXT_SEARCH_FIELDS = ['first_name', 'last_name', 'username'];

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

    return `
      SELECT "${tableKey}".*, "user"."email" AS "email"
             ${include.includes('avatar') ? ', row_to_json("avatar".*) AS "avatar"' : ''}
      FROM (${query}) AS "${tableKey}"
      LEFT JOIN "spiti"."user" AS "user" ON "user"."id" = "${this.baseModel.tableKey}"."userId"
      ${include.includes('avatar') ? this._includeAvatar() : ''}
    `;
  }

  _includeAvatar() {
    return `
      LEFT JOIN "spiti"."attachment" AS "avatar" ON "avatar"."id" = "${this.baseModel.tableKey}"."avatar_id"
    `;
  }
};
