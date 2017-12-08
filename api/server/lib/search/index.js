'use strict';

const debug = require('debug')('spiti:feed:search');

import Promise from 'bluebird';

import { errValidation } from '../errors';
import { formatSQLReplacements } from '../util';

const DEFAULT_SCHEMA = 'public';
const OPERATORS = {
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
  is: '='
};
const MODELS = [
  { name: 'feed', model: 'Feed', isBase: true },
  { name: 'feedOptions', model: 'FeedOptions' },
  { name: 'geolocations', model: 'Geolocation' },
  { name: 'geolocaion_to_feed', model: 'GeolocationToFeed', hide:true }
];

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
    this.models = {};

    this.whereValues = [];
    this.replacements = [];

    this.sqlSelect = '';
    this.sqlWhere = '';
    this.sqlJoin = '';

    this._prepareModelsData(app);
  }

  query(filter) {
    try {
      let { query, replacements } = this.buildQuery(filter);

      return this._query(query, replacements);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  buildQuery(filter = {}) {
    this.filter = {...filter};

    let filters = filter.where || {};

    debug('Start build query', filters);
    let baseModelOptions;

    Object.keys(this.models).forEach(key => {
      let modelOptions = this.models[key];
      if (modelOptions.isBase) {
        baseModelOptions = modelOptions;
        return;
      }

      if (!modelOptions.hide && filters[key]) {
        this._buildQueryForModel(modelOptions, filters[key]);
      }
    });

    this._buildQueryForModel(baseModelOptions, filters);

    let query = this.sqlSelect;
    query += this.sqlJoin;
    query += this._buildWhereQuery();
    query += this._buildOrderQuery(baseModelOptions, filter.order);
    query += this._buildLimitOffsetQuery(baseModelOptions, filter);
    query = this._buildIncludesQuery(query);

    debug('Finish build query');
    return {
      query,
      replacements: this.replacements
    };
  }

  /**
   * @param {Object} modelOptions
   * @param {Object} modelOptions.properties - loopback model definition. used to filter properties.
   * @param {String} modelOptions.tableName - postgresql table name.
   * @param {String} modelOptions.schema - postgresql table schema.
   * @param {String} modelOptions.tableKey - table alias.
   * @param {Object} filters
   */
  _buildQueryForModel(modelOptions, filters = {}) {
    debug('Build query for model');
    let { properties, tableKey, isBase } = modelOptions;

    Object.keys(filters).forEach(key => {
      let property = properties[key];

      if (!property && this._isNestedProperty(key)) {
        let nestedProp = key.split('.')[0];
        if (nestedProp && this._isNestedPropertyAllowed(properties, nestedProp)) {
          property = nestedProp;
        }
      }

      if (!property) {
        if (this.options.throwError) {
          throw errValidation(`Unsupported search property ${property}.`);
        } else {
          return;
        }
      }

      let columnName = this._getColumnName(key);
      let expression = filters[key];

      this.whereValues[tableKey] = this.whereValues[tableKey] || [];
      return this._buildWhereQueryForProp(tableKey, columnName, expression);
    });

    if (isBase) {
      this.sqlSelect = this._buildSelectQuery(modelOptions);
    } else {
      this.sqlJoin += this._buildJoinQuery(modelOptions);
    }
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

  _buildWhereQueryForProp(tableKey, columnName, expression) {
    debug('Build tableName: ', tableKey, columnName, expression);

    if (expression === null || expression === 'null') {
      this.whereValues[tableKey].push({
        column: `"${tableKey}".${columnName}`,
        operator: OPERATORS['is'],
        value: null
      });
    } else if (typeof expression == 'object') {
      Object.keys(expression).map(key => {
        if (OPERATORS[key]) {
          this.whereValues[tableKey].push({
            column: `"${tableKey}".${columnName}`,
            operator: OPERATORS[key],
            value: expression[key]
          });
        }
      });
    } else if (expression) {
      this.whereValues[tableKey].push({
        column: `"${tableKey}".${columnName}`,
        operator: OPERATORS['is'],
        value: expression
      });
    }
  }

  _buildWhereQuery() {
    let { whereValues, baseModel } = this;

    let query = `WHERE "${baseModel.tableKey}"."deleted_at" IS NULL `;

    Object.keys(whereValues).forEach(tableKey => {
      query += this._buildWhereStrings(whereValues[tableKey], tableKey);
    });

    return query;
  }

  _buildWhereStrings(whereValues, tableKey, orQuery = '') {
    let query = '';
    let { replacements } = this;
    let totalLength = replacements.length;

    whereValues.forEach((where, i) => {
      if (orQuery && i === 0) {
        query += ` AND (${where.column} ${where.operator || ''} $${i + 1 + totalLength}`;
      } else {
        query += ` AND ${where.column} ${where.operator || ''} $${i + 1 + totalLength}`;
      }
      console.log('value...............................', where.value)
      if (typeof where.value != 'undefined') {
        replacements.push(where.value);
      }
    });

    if (orQuery) {
      query += ` OR ${orQuery})`;
    }

    return query;
  }

  _buildSelectQuery(modelOptions) {
    let { tableName, tableKey } = modelOptions;
    debug('Build select query');

    return `
      SELECT "${tableName}".*
      FROM "spiti"."feed" as "${tableKey}"
    `;
  }

  _buildJoinQuery(modelOptions) {
    let { tableName, tableKey, relation } = modelOptions;
    debug('Build join query', relation);

    if (!relation) {
      return '';
    }

    if (relation.type == 'hasOne') {
      return this._buildJoinQueryHasOne(modelOptions);
    } else if (relation.type == 'hasMany' && relation.through) {
      return this._buildJoinQueryHasManyThrough(modelOptions);
    }

    return '';
  }

  _buildJoinQueryHasOne(modelOptions) {
    debug('Build join HasOne query');
    let { tableName, tableKey, schema, relation } = modelOptions;

    return `
      LEFT OUTER JOIN "${schema}"."${tableName}" AS "${tableKey}"
        ON "${tableKey}"."${relation.foreignKey}" = "${this.baseModel.tableKey}"."id"
        AND "${tableKey}"."deleted_at" IS NULL
    `;
  }

  _buildJoinQueryHasManyThrough(modelOptions) {
    debug('Build join HasManyThrough query');
    let { tableName, tableKey, schema, relation } = modelOptions;
    let throughModel = Object.values(this.models).find(model => model.modelName == relation.through);

    return `
      INNER JOIN "${throughModel.schema}"."${throughModel.tableName}" AS "${throughModel.tableKey}"
          ON "${throughModel.tableKey}"."${relation.foreignKey}" = "${this.baseModel.tableKey}"."id"
        INNER JOIN "${schema}"."${tableName}" AS "${tableKey}"
          ON "${throughModel.tableKey}"."${relation.keyThrough}" = "${tableKey}"."id"
          AND "${tableKey}"."deleted_at" IS NULL
    `;
  }

  _buildLimitOffsetQuery(modelOptions, filter) {
    debug('Build limit, offset query');
    let {limit, offset, skip} = filter;

    return `
      LIMIT ${parseInt(limit) || 10}
      OFFSET ${parseInt(offset) || skip || 0}
    `;
  }

  _buildOrderQuery(modelOptions, order) {
    debug('Build order query');
    let orderStatments = [];

    if (Array.isArray(order)) {
      order.forEach(o => {
        let orderString = this._buildOrderQueryString(modelOptions, o);
        if (orderString) {
          orderStatments.push(orderString);
        }
      });
    } else {
      let orderString = this._buildOrderQueryString(modelOptions, order);
      if (orderString) {
        orderStatments.push(orderString);
      }
    }

    if (!orderStatments.length) {
      orderStatments.push('id DESC');
    }

    return ` ORDER BY ${orderStatments.join(', ')} `;
  }

  _buildOrderQueryString(modelOptions, order) {
    if (!order || typeof order != 'string') {
      return null;
    }

    let [columnName, direction] = order.split(' ');
    if (!columnName && !direction && ['ASC', 'DESC'].includes(direction)) {
      return null;
    }

    let { properties, tableKey } = modelOptions;
    if (!properties[columnName]) {
      return null;
    }

    return `"${tableKey}"."${columnName}" ${direction}`;
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

  _buildIncludesQuery(query) {
    return query;
  }

  /**
   * Execute search query.
   * @return {Promise<Array>} query results.
   */
  _query(sql, replacements) {
    if (this.options.debugSql || true) {
      let rawSql = sql;
      replacements.forEach((value, i) => {
        rawSql = rawSql.replace(`$${i + 1}`, value);
      });
      debug('execute sql: ', rawSql);
    } else {
      debug('execute          sql: ', sql);
      debug('execute replacements: ', replacements);
    }

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
    let modelKeys = Object.keys(MODELS).map;

    let baseModelOptions = MODELS.find(m => m.isBase);

    if (!baseModelOptions) {
      throw new Error('Base model not specified');
    }

    this.baseModel = this._getPrepareModelOptions(app, baseModelOptions);

    MODELS.forEach(modelOptions => {
      if (modelOptions.isBase) {
        this.models[modelOptions.name] = this.baseModel;
      } else {
        this.models[modelOptions.name] = this._getPrepareModelOptions(app, modelOptions, this.baseModel);
      }
    });
  }

  _getPrepareModelOptions(app, modelOptions, baseModel) {
    debug('Prepare model options');

    let modelName = modelOptions.model;
    let modelDefinition = app.models[modelName].definition;
    let dbOptions = modelDefinition.settings && modelDefinition.settings.postgresql || {};

    let tableName = dbOptions.table || modelDefinition.tableName();
    let schema = dbOptions.schema || DEFAULT_SCHEMA;

    let collectedOptions = {
      tableKey: modelOptions.name,
      modelDefinition,
      modelName,
      tableName,
      schema,
      properties: modelDefinition.properties,
      isBase: modelOptions.isBase
    };

    if (!modelOptions.isBase && baseModel) {
      collectedOptions.relation = this._getRelationSettings(collectedOptions, baseModel);
    }

    return collectedOptions;
  }

  _getRelationSettings(related, base) {
    let { tableKey } = related;
    let relation = base.modelDefinition.settings.relations[tableKey];
    return relation;
  }
}
