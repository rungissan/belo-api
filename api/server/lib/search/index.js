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
  is: '=',
  neq: '!='
};
const NULL_OPERATORS = {
  is: 'IS NULL',
  neq: 'IS NOT NULL'
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

    this.whereValues = {};
    this.replacements = [];

    this.sqlSelect = '';
    this.sqlWhere = '';
    this.sqlJoin = '';

    this.baseModel = this._getBaseModelOptions(app.models, options.baseModelName);
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
    filter = this._validateFilter(filter);
    this.filter = {...filter};

    let filters = filter.where || {};

    debug('Start build query', filters);
    let { baseModel } = this;

    Object.keys(filters).forEach(key => {
      if (this._modelHaveProperty(baseModel.properties, key)) {
        return;
      }

      let isModelRelated = this._isModelRelated(baseModel.Model, key);
      if (isModelRelated) {
        const modelOptions = this._getOptionsForModel(this.app.models, key, baseModel);
        this._buildQueryForModel(modelOptions, filters[key]);
      }
    });

    this._buildQueryForModel(baseModel, filters);

    let query = this.sqlSelect;
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

  /**
   * @param {Object} modelOptions
   * @param {Object} modelOptions.properties - loopback model definition. used to filter properties.
   * @param {String} modelOptions.tableName - postgresql table name.
   * @param {String} modelOptions.schema - postgresql table schema.
   * @param {String} modelOptions.tableKey - table alias.
   * @param {Object} filters
   */
  _buildQueryForModel(modelOptions, filters = {}) {
    debug('Build query for model', modelOptions.modelName);
    let { properties, tableKey, isBase } = modelOptions;
    this.whereValues[tableKey] = this.whereValues[tableKey] || [];

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

      return this._buildWhereQueryForProp(tableKey, columnName, expression);
    });

    if (isBase && properties.deleted_at) {
      this._buildWhereQueryForProp(tableKey, 'deleted_at', {not: null});
    }

    if (!this.whereValues[tableKey].length) {
      delete this.whereValues[tableKey];
    }

    if (isBase) {
      this.sqlSelect = this._buildSelectQuery(modelOptions);
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

  _buildWhereQueryForProp(tableKey, columnName, expression) {
    debug('Build tableName: ', tableKey, columnName, expression);

    if (expression === null || expression === 'null') {
      this.whereValues[tableKey].push({
        column: `"${tableKey}".${columnName}`,
        operator: NULL_OPERATORS['is']
      });
    } else if (typeof expression == 'object') {
      Object.keys(expression).map(key => {
        if (OPERATORS[key]) {
          if (expression[key] === null) {
            let nullOperator = NULL_OPERATORS[key];

            if (nullOperator) {
              this.whereValues[tableKey].push({
                column: `"${tableKey}".${columnName}`,
                operator: nullOperator
              });
            }
          } else {
            this.whereValues[tableKey].push({
              column: `"${tableKey}".${columnName}`,
              operator: OPERATORS[key],
              value: expression[key]
            });
          }
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
    let query = '';

    Object.keys(whereValues).forEach((tableKey, index) => {
      query += this._buildWhereStrings(whereValues[tableKey], tableKey, index);
    });

    return query;
  }

  _buildWhereStrings(whereValues, tableKey, whereQueriesIndex, orQuery = '') {
    let query = '';
    let { replacements } = this;
    let totalConditionsLength = replacements.length;
    let whereConditionId = 1;

    whereValues.forEach((where, i) => {
      let joinKey = (whereQueriesIndex === 0 && i === 0) ? 'WHERE' : 'AND';

      if (orQuery && whereConditionId === 1) {
        query += ` ${joinKey} (${where.column} ${where.operator || ''}`;
      } else {
        query += ` ${joinKey} ${where.column} ${where.operator || ''}`;
      }

      if (typeof where.value != 'undefined' && where.value !== null) {
        query += ` $${whereConditionId + totalConditionsLength}`;
        replacements.push(where.value);
        whereConditionId++;
      }
    });

    if (orQuery) {
      query += ` OR ${orQuery})`;
    }

    return query;
  }

  _buildSelectQuery(modelOptions) {
    let { tableName, tableKey, schema } = modelOptions;
    debug('Build select query');

    return `SELECT "${tableKey}".* FROM "${schema}"."${tableName}" as "${tableKey}" `;
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
          return reject(err);
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
