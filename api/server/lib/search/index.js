'use strict';

const debug = require('debug')('spiti:feed:search');

import Promise from 'bluebird';
import {
  set as _set,
  get as _get
} from 'lodash';

import { errValidation } from '../errors';
import { formatSQLReplacements } from '../util';

const DEFAULT_SCHEMA = 'public';
const OPERATORS = {
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
  is: '=',
  neq: '!='
};
const NULL_OPERATORS = {
  is: 'IS NULL',
  neq: 'IS NOT NULL'
};
// const AGGREGATE_OPERATORS = ['or', 'and'];
const AGGREGATE_OPERATORS = {
  or: 'OR',
  and: 'AND'
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
      throw new Error('connector is required');
    }

    if (!app) {
      throw new Error('app is required');
    }

    if (!options.baseModelName) {
      throw new Error('baseModelName is required');
    }

    this.connector = connector;
    this.app = app;
    this.options = options;
    this.models = {};
    this.queryOptions = {};
    this.userOptions = {};

    this.whereValues = {};
    this.replacements = [];

    this.sqlSelect = '';
    this.sqlWhere = '';
    this.sqlJoin = '';
    this.joinKey = 'WHERE';
    this.selectedTables = [];

    this.baseModel = this._getBaseModelOptions(app.models, options.baseModelName);
  }

  query(filter, userOptions = {}) {
    this.userOptions = userOptions;
    try {
      let { query, replacements } = this.buildQuery(filter);

      return this._query(query, replacements);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  buildQuery(filter = {}) {
    filter = this._validateFilter(filter);
    this.filter = {...filter};
    this.queryOptions = filter.queryOptions || {};

    let filters = filter.where || {};

    debug('Start build query', filters);
    let { baseModel } = this;

    Object.keys(filters).forEach(key => {
      this._buildQueryForNotBasicProperty(baseModel, key, filters[key]);
    });

    let query = this._buildSelectQuery(baseModel);
    query += this.sqlJoin;
    query += this._buildWhereQuery();
    query += this._buildOrderQuery(baseModel, filter.order);
    query += this._buildLimitOffsetQuery(filter);
    query = this._buildIncludesQuery(query);

    debug('Finish build query');
    return {
      query,
      replacements: this.replacements
    };
  }

  _buildQueryForNotBasicProperty(baseModel, key, filters, aggregateKey = '') {
    if (this._modelHaveProperty(baseModel.properties, key)) {
      this._buildQueryForModel(baseModel, {[key]: filters}, aggregateKey);
      return;
    }

    let isModelRelated = this._isModelRelated(baseModel.Model, key);

    if (isModelRelated) {
      const modelOptions = this._getOptionsForModel(this.app.models, key, baseModel);
      this._buildQueryForModel(modelOptions, filters, aggregateKey);
    } else if (AGGREGATE_OPERATORS[key] && Array.isArray(filters)) {
      filters.forEach((condition, i) => {
        let modelKey = Object.keys(condition)[0];

        if (!modelKey) {
          return;
        }

        let path = aggregateKey;
        if (!aggregateKey) {
          path = `${key}.${i}`;
        } else {
          path = `${path}.${key}.${i}`;
        }

        this._buildQueryForNotBasicProperty(baseModel, modelKey, condition[modelKey], path);
      });
    }
  }

  /**
   * @param {Object} modelOptions
   * @param {Object} modelOptions.properties - loopback model definition. used to filter properties.
   * @param {String} modelOptions.tableName - postgresql table name.
   * @param {String} modelOptions.schema - postgresql table schema.
   * @param {String} modelOptions.tableKey - table alias.
   * @param {Object} filters
   */
  _buildQueryForModel(modelOptions, filters = {}, aggregateKey) {
    debug('Build query for model', modelOptions.modelName);
    let { properties, tableKey, isBase } = modelOptions;
    let conditions = [];

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

      return this._buildWhereQueryForProp(conditions, tableKey, columnName, expression);
    });

    if (isBase && properties.deleted_at) {
      this._buildWhereQueryForProp(conditions, tableKey, 'deleted_at', {not: null});
    }

    if (conditions.length) {
      if (aggregateKey) {
        _set(this.whereValues, aggregateKey, conditions);
      } else {
        let conditionsList = this.whereValues[tableKey] || [];
        this.whereValues[tableKey] = [...conditionsList, ...conditions];
      }
    }

    if (this.selectedTables.includes(modelOptions.tableKey)) {
      return;
    }
    this.selectedTables.push(modelOptions.tableKey);

    if (isBase) {
      // this.sqlSelect = this._buildSelectQuery(modelOptions);
    } else {
      this.sqlJoin += this._buildJoinQuery(modelOptions);
    }
  }

  _isNestedProperty(key) {
    return key.split('.').length > 1;
  }

  _isNestedPropertyAllowed(modelProps, property) {
    let propOptions = modelProps[property] && modelProps[property][this.connector.name];
    return propOptions ? propOptions.dataType === 'jsonb' : false;
  }

  _getColumnName(key) {
    if (this._isNestedProperty(key)) {
      return key
        .split('.')
        .map((val, i) => {
          return (i === 0 ? this._getColumnName(val) : val);
        })
        .reduce((prev, next, i, arr) => {
          return i == 0 ? next : i < arr.length - 1 ? prev + `->'${next}'` : prev + `->>'${next}'`;
        });
    } else {
      return `"${key}"`;
    }
  }

  _buildWhereQueryForProp(conditionsList, tableKey, columnName, expression) {
    debug('Build tableName: ', tableKey, columnName, expression);

    if (expression === null || expression === 'null') {
      conditionsList.push({
        column: `"${tableKey}".${columnName}`,
        operator: NULL_OPERATORS['is']
      });
    } else if (typeof expression == 'object') {
      Object.keys(expression).map(key => {
        if (OPERATORS[key]) {
          if (expression[key] === null) {
            let nullOperator = NULL_OPERATORS[key];

            if (nullOperator) {
              conditionsList.push({
                column: `"${tableKey}".${columnName}`,
                operator: nullOperator
              });
            }
          } else {
            conditionsList.push({
              column: `"${tableKey}".${columnName}`,
              operator: OPERATORS[key],
              value: expression[key]
            });
          }
        }
      });
    } else if (typeof expression !== 'undefined') {
      conditionsList.push({
        column: `"${tableKey}".${columnName}`,
        operator: OPERATORS['is'],
        value: expression
      });
    }
  }

  _buildWhereQuery() {
    let { whereValues, baseModel } = this;
    let query = '';

    query = this._buildWhereForValues(whereValues);

    return query;
  }

  _buildWhereForValues(values, aggType, aggIndex = 0, aggLevel = 0) {
    let query = '';

    if (Array.isArray(values)) {
      values.forEach((value, i) => {
        if (Array.isArray(value) && values.length > 1) {
          if (aggType) {
            return this._buildWhereForValues(value, aggType);
          }
        } else {
          query += this._buildWhereStrings(value, i, aggType);
        }
      });
    } else if (typeof values === 'object') {
      Object.keys(values).forEach(key => {
        if (AGGREGATE_OPERATORS[key] && Array.isArray(values[key])) {
          let aggValuesList = values[key];
          aggValuesList = aggValuesList.filter(val => !!val);
          if (aggLevel === 0) {
            query += ` ${this._getJoinKey()} (`;
          }

          aggValuesList.forEach((aggValues, i) => {
            if (i > 0) {
              query += ` ${AGGREGATE_OPERATORS[key]} `;
            }
            query += '(';
            query += this._buildWhereForValues(aggValues, key, i, aggLevel + 1);
            query += ')';
          });

          if (aggLevel === 0) {
            query += ')';
          }
        } else if (!aggType) {
          query += this._buildWhereForValues(values[key]);
        };
      });
    }

    return query;
  }

  _getJoinKey() {
    if (this.joinKey === 'WHERE') {
      this.joinKey = 'AND';
      return 'WHERE';
    }
    return this.joinKey;
  }

  _buildWhereStrings(where, i, aggType) {
    let query = '';
    let { replacements } = this;

    if (!(aggType && i === 0)) {
      query += ` ${this._getJoinKey()}`;
    }

    query += ` ${where.column} ${where.operator || ''}`;

    if (typeof where.value != 'undefined' && where.value !== null) {
      query += ` $${replacements.length + 1}`;
      replacements.push(where.value);
    }

    return query;
  }

  // TODO: Check if need distinct query
  _buildSelectQuery(modelOptions) {
    let { tableName, tableKey, schema } = modelOptions;
    debug('Build select query');

    // let distinctQuery =

    let query = 'SELECT';

    if (this.queryOptions.distinct) {
      query += ` DISTINCT ON ("${tableKey}".id)`;
    }

    query += ` "${tableKey}".* FROM "${schema}"."${tableName}" as "${tableKey}" `;
    return query;
    // return `SELECT "${tableKey}".* FROM "${schema}"."${tableName}" as "${tableKey}" `;
  }

  _buildJoinQuery(modelOptions) {
    let { relation } = modelOptions;
    debug('Build join query', relation);

    if (!relation) {
      return '';
    }

    if (relation.keyThrough) {
      return this._buildJoinQueryThrough(modelOptions);
    } else {
      return this._buildJoinQueryHas(modelOptions);
    }

    return '';
  }

  _buildJoinQueryHas(modelOptions) {
    debug('Build join Has query');
    let { tableName, tableKey, schema, relation, properties } = modelOptions;

    let query = ` LEFT OUTER JOIN "${schema}"."${tableName}" AS "${tableKey}"`;
    query += ` ON "${tableKey}"."${relation.keyTo}" = "${this.baseModel.tableKey}"."${relation.keyFrom}"`;

    if (properties.deleted_at) {
      query += ` AND "${tableKey}"."deleted_at" IS NULL`;
    }

    return query;
  }

  _buildJoinQueryThrough(modelOptions) {
    debug('Build join through query');
    let { tableName, tableKey, schema, relation, properties } = modelOptions;
    let { keyFrom, keyTo, keyThrough, tableThrough } = relation;

    let query = ` LEFT OUTER JOIN "${tableThrough.schema}"."${tableThrough.tableName}" AS "${tableThrough.tableName}"` +
      ` ON "${tableThrough.tableName}"."${keyTo}" = "${this.baseModel.tableKey}"."${keyFrom}"`;

    if (tableThrough.properties.deleted_at) {
      query += ` AND "${tableThrough.tableName}"."deleted_at" IS NULL`;
    }

    query += ` LEFT OUTER JOIN "${schema}"."${tableName}" AS "${tableKey}"` +
      ` ON "${tableThrough.tableName}"."${keyThrough}" = "${tableKey}"."id"`;

    if (properties.deleted_at) {
      query += ` AND "${tableKey}"."deleted_at" IS NULL`;
    }

    return query;
  }

  _buildLimitOffsetQuery(filter) {
    debug('Build limit, offset query');
    let {limit, offset, skip} = filter;

    return ` LIMIT ${parseInt(limit) || 10} OFFSET ${parseInt(offset) || skip || 0}`;
  }

  _buildOrderQuery(modelOptions, order) {
    debug('Build order query');
    let orderStatments = [];

    if (Array.isArray(order)) {
      order.forEach(o => {
        let orderString = this._buildOrderQueryString(modelOptions, o);
        orderString && orderStatments.push(orderString);
      });
    } else if (order) {
      let orderString = this._buildOrderQueryString(modelOptions, order);
      orderString && orderStatments.push(orderString);
    }

    if (!orderStatments.length) {
      let defaultOrderString = this._buildOrderQueryString(modelOptions, 'id DESC');
      defaultOrderString && orderStatments.push(defaultOrderString);
    }

    if (!orderStatments.length) {
      return '';
    }

    return ` ORDER BY ${orderStatments.join(', ')}`;
  }

  _buildOrderQueryString(modelOptions, order) {
    if (!order || typeof order != 'string') {
      return null;
    }

    let [columnName, direction] = order.split(' ');
    if (!(columnName && direction && ['ASC', 'DESC', 'asc', 'desc'].includes(direction))) {
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
    if (this.options.debugSql) {
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
          console.log(err);
          let error = new Error('Error occured');
          error.status = 500;
          return reject(error);
        }
        return resolve(data);
      });
    });
  }

  _getBaseModelOptions(models, baseModelName) {
    return this._getOptionsForModel(models, baseModelName);
  }

  /**
   * @param {Object} models loopback application models
   * @param {String} baseModelName loopback model name
   * @return {Object} {
   *   tableKey,
   *   modelDefinition,
   *   modelName,
   *   tableName,
   *   schema,
   *   properties,
   *   relation,
   *   isBase
   * }
   */
  _getOptionsForModel(models, modelAlias, baseModel) {
    debug('Get options for model', modelAlias);
    let Model;
    let modelRelation;
    if (baseModel) {
      modelRelation = this._getModelRelation(baseModel.Model, modelAlias);
      Model = modelRelation.modelTo;
    } else {
      Model = models[modelAlias];
    }

    if (!Model) {
      throw new Error(`Model ${modelAlias} not found`);
    }

    let modelDefinition = Model.definition;
    let modelName = modelDefinition.name;
    let dbOptions = modelDefinition.settings && modelDefinition.settings[this.connector.name] || {};

    let tableName = dbOptions.table || modelDefinition.tableName();
    let schema = dbOptions.schema || DEFAULT_SCHEMA;

    let collectedOptions = {
      tableKey: modelAlias,
      Model,
      modelDefinition,
      modelName,
      tableName,
      schema,
      properties: modelDefinition.properties,
      isBase: !baseModel
    };

    if (baseModel) {
      collectedOptions.relation = this._getRelationOptions(modelRelation);
    }

    return collectedOptions;
  }

  _getModelRelation(Model, modelAlias) {
    let { relations } = Model;
    let relation = relations[modelAlias];

    if (!relation) {
      throw new Error(`Model ${modelAlias} not related to ${Model.name}`);
    }

    return relation;
  }

  _getRelationOptions(modelRelation) {
    let { keyFrom, keyTo, keyThrough, modelThrough, type } = modelRelation;

    let relationOptions = {
      keyFrom,
      keyTo,
      keyThrough,
      type
    };

    if (modelThrough) {
      let modelThroughDefinition = modelThrough.definition;
      let dbOptions = modelThroughDefinition.settings && modelThroughDefinition.settings[this.connector.name] || {};
      let tableName = dbOptions.table || modelThroughDefinition.tableName();
      let schema = dbOptions.schema || DEFAULT_SCHEMA;

      relationOptions.tableThrough = {
        tableName,
        schema,
        properties: modelThroughDefinition.properties
      };
    }

    return relationOptions;
  }

  _modelHaveProperty(modelProperties, key) {
    return !!modelProperties[key];
  }

  _isModelRelated(Model, key) {
    let { relations } = Model;
    let relation = relations[key];

    return !!relation;
  }

  _validateFilter(filter) {
    return filter;
  }
}
