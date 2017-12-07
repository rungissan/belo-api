'use strict';

const debug = require('debug')('spiti:feed:search');

import Promise from 'bluebird';

import { errValidation } from '../errors';
import { formatSQLReplacements } from '../util';

const OPERATORS = {
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
  is: '='
};

const MODELS = {
  feed: 'Feed',
  feedOptions: 'FeedOptions',
  geolocaions: 'Geolocation',
  geolocaion_to_feed: 'GeolocationToFeed'
};

/** Searcher for feeds. */
export default class FeedSearch {
  /**
   * Create searcher.
   * @param {Object} connector - loopback dataSource connector.
   * @param {Object} options.
   */
  constructor(connector, app, options = {}) {
    if (!connector) {
      throw new Error('connector not specified');
    }

    this.connector = connector;
    this.options = options;

    this.feedDefinition = app.models.Feed.definition;
    this.feedOptionsDefinition = app.models.FeedOptions.definition;

    this.feedTableKey = 'feed';
    this.feedOptionsTableKey = 'feedOptions';

    this.whereValues = [];
    this.replacements = [];

    this._prepareModelsData(app);
  }

  query(filters) {
    try {
      let { query, replacements } = this.buildQuery(filters);

      return this._query(query, replacements);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  buildQuery(filters = {}) {
    this.filters = filters;

    debug('Start build query', filters);
    let { feedDefinition, feedOptionsDefinition } = this;

    if (filters.feedOptions) {
      this.buildQueryForModel(feedOptionsDefinition, this.feedOptionsTableKey, filters.feedOptions);
    }

    this.buildQueryForModel(feedDefinition, this.feedTableKey, filters);

    let query = this._addSelectQuery();
    query += this._addFeedOptionsJoinQuery();
    query += this._buildWhereQuery();

    debug('Finish build query');
    return {
      query,
      replacements: this.replacements
    };
  }

  /**
   * @param {Object} modelDefinition
   * @param {Object} filters
   * @returns {ParameterizedSQL}
   */
  buildQueryForModel(modelDefinition, tableName, filters = {}) {
    let modelProps = modelDefinition.properties;

    Object.keys(filters).forEach(key => {
      let property = modelProps[key];

      if (!property && this._isNestedProperty(key)) {
        let nestedProp = key.split('.')[0];
        debug('nestedProp: ', nestedProp);

        if (nestedProp && this._isNestedPropertyAllowed(modelProps, nestedProp)) {
          property = nestedProp;
        }
      }

      if (!property) {
        if (this.options.throwError) {
          throw errValidation(`Unsupported search property ${property}.`);
        } else {
          debug('Skip property: ', key);
          return;
        }
      }
      debug('Process property: ', key);

      let columnName = this._getColumnName(key);
      let expression = filters[key];

      return this._buildWhereQueryForProp(tableName, columnName, expression);
    });
  }

  _isNestedProperty(key) {
    return key.split('.').length > 1;
  }

  _getNestedProperty(property) {
    let splitedProp = property.split('.');
    return splitedProp.length > 1 ? splitedProp.length[0] : false;
  }

  _isNestedPropertyAllowed(modelProps, property) {
    let propOptions = modelProps[property] && modelProps[property].postgresql;
    return propOptions && propOptions.dataType == 'jsonb';
  }

  _getColumnName(key) {
    if (this._isNestedProperty(key)) {
      return key
        .split('.')
        .map((val, i) => {
          return (i === 0 ? this._getColumnName(val) : val);
        })
        .reduce((prev, next, i, arr) => {
          return i == 0 ? next : i < arr.length - 1 ? prev + `->'${next}'` + next : prev + `->>'${next}'`;
        });
    } else {
      return `"${key}"`;
    }
  }

  _buildWhereQueryForProp(tableName, columnName, expression) {
    debug('Build tableName: ', tableName, columnName, expression);

    if (expression === null || expression === 'null') {
      this.whereValues.push({
        column: `"${tableName}".${columnName}`,
        value: 'IS NULL'
      });
    } else if (typeof expression == 'object') {
      Object.keys(expression).map(key => {
        if (OPERATORS[key]) {
          this.whereValues.push({
            column: `"${tableName}".${columnName}`,
            operator: OPERATORS[key],
            value: expression[key]
          });
        }
      });
    } else if (expression) {
      this.whereValues.push({
        column: `"${tableName}".${columnName}`,
        operator: OPERATORS['is'],
        value: expression
      });
    }
  }

  _buildWhereQuery() {
    let { whereValues, replacements } = this;

    let query = '';

    whereValues.forEach((where, i) => {
      query += (i === 0) ? 'WHERE ' : ' AND ';
      // query += `${where.column} ${where.operator || ''} ${where.value || ''}`;
      query += `${where.column} ${where.operator || ''} $${i + 1}`;

      if (where.value) {
        replacements.push(where.value);
      }
    });

    return query;
  }

  _addSelectQuery() {
    let { feedTableKey } = this;

    return `
      SELECT "${feedTableKey}".*
      FROM "spiti"."feed" as "${feedTableKey}"
    `;
  }

  _addGeolocationJoinQuery() {
    return `
      INNER JOIN "spiti"."geolocation_to_feed" AS "geolocation_feed"
          ON "geolocation_feed"."feedId" = "feed"."id"
        INNER JOIN "spiti"."geolocation" AS "geolocation"
          ON "geolocation_feed"."geolocationId" = "geolocation"."id"
          AND "geolocation"."deleted_at" IS NULL
    `;
  }

  _addFeedOptionsJoinQuery() {
    let { feedTableKey, feedOptionsTableKey } = this;

    return `
      LEFT OUTER JOIN "spiti"."feed_options" AS "${feedOptionsTableKey}"
        ON "${feedOptionsTableKey}"."feedId" = "${feedTableKey}"."id"
        AND "${feedOptionsTableKey}"."deleted_at" IS NULL
    `;
  }

  /**
   * Check property for unsupported symbols.
   * @param {String} prop
   * @return {Boolean}.
   */
  _filterProperty(prop) {
    if (prop.test(/[^\w]/)) {
      throw errValidation(`Unsupported search property ${prop}.`);
    }
    return true;
  }

  // /**
  //  * Wrap main query to include addtional tables.
  //  * @param {String} query.
  //  * @param {String} includeOptions.
  //  * @return {String}.
  //  */
  // _addIncludesQueryQuery(query, includeOptions) {
  //   return `${query}`;
  // }

  /**
   * Execute search query.
   * @return {Promise<Array>} query results.
   */
  _query(sql, replacements) {
    debug('execute          sql: ', sql);
    debug('execute replacements: ', replacements);

    return new Promise((resolve, reject) => {
      return this.connector.execute(sql, replacements, (err, data) => {
        if (err) {
          return reject(err);
        }
        return resolve(data);
      });
    });
  }

  _prepareModelsData(app) {
    this.models = {};

    Object.keys(MODELS).forEach(tableKey => {
      let modelName = MODELS[tableKey];
      let modelDefinition = app.models[modelName].definition;
      let tableName = modelDefinition.settings &&
                      modelDefinition.settings.postgresql &&
                      modelDefinition.settings.postgresql.table ||
                      modelDefinition.tableName();

      this.models[tableKey] = {
        tableKey,
        modelName,
        tableName,
        properties: modelDefinition.properties
      };
    });
  }
}
