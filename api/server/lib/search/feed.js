'use strict';

import BaseSearchController from './index';

export default class FeedSearch extends BaseSearchController {
  constructor(connector, app, options) {
    super(connector, app, options);
  }

  _buildWhereQuery() {
    let { whereValues, baseModel } = this;

    let query = `WHERE "${baseModel.tableKey}"."deleted_at" IS NULL `;

    Object.keys(whereValues).forEach(tableKey => {
      let feedType = this.filter.where && this.filter.where.feedType;
      let orQuery;
      if (tableKey == 'feedOptions' && (!feedType || feedType === 'post')) {
        orQuery = `"${baseModel.tableKey}"."type" = 'post'`;
      }
      query += this._buildWhereStrings(whereValues[tableKey], tableKey, orQuery);
    });

    return query;
  }
};
