'use strict';
/* eslint-disable no-unused-expressions */

import { expect } from 'chai';
import Promise from 'bluebird';
import { join } from 'path';
import sinon from 'sinon';

import app from '../../server/server';
import Search from '../../server/lib/search';
import MODELS from '../mocks/search-models';

describe('Search', function() {
  let models = {};

  before(() => {
    Object.keys(MODELS).forEach(modelName => {
      let modelOptions = MODELS[modelName];
      modelOptions.dataSource = 'postgres';

      models[modelName] = app.registry.createModel(modelOptions);
      app.model(models[modelName], {dataSource: 'postgres'});
    });
  });

  after(() => {});

  describe('constructor', function() {
    it('should throw error if connector not specified', () => {
      expect(() => {
        new Search();
      }).to.throw('connector is required');
    });

    it('should throw error if loopback app not specified', () => {
      expect(() => {
        new Search(app.dataSources.postgres.connector);
      }).to.throw('app is required');
    });

    it('should throw error if no baseModelName specified', () => {
      expect(() => {
        new Search(app.dataSources.postgres.connector, app);
      }).to.throw('baseModelName is required');
    });

    it('should throw error if no baseModelName incorrect', () => {
      expect(() => {
        new Search(app.dataSources.postgres.connector, app, {baseModelName: 'IncorrectModelName'});
      }).to.throw('Model IncorrectModelName not found');
    });

    it('should successfully initialise', () => {
      expect(() => {
        new Search(app.dataSources.postgres.connector, app, {baseModelName: 'TestProduct'});
      }).not.to.throw(Error);
    });
  });

  describe('builders: property', function() {
    let searchCtrl;

    before(() => {
      searchCtrl = new Search(app.dataSources.postgres.connector, app, {baseModelName: 'TestProductOptions'});
    });

    it('_isNestedProperty should return falss if key not nested', () => {
      expect(searchCtrl._isNestedProperty('prop')).to.equal(false);
    });

    it('_isNestedProperty should return true if key is nested', () => {
      expect(searchCtrl._isNestedProperty('prop.nested')).to.equal(true);
    });

    it('_isNestedPropertyAllowed should return true only if property is jsonb', () => {
      let modelProps = searchCtrl.baseModel.properties;

      expect(searchCtrl._isNestedPropertyAllowed(modelProps, 'price')).to.equal(false);
      expect(searchCtrl._isNestedPropertyAllowed(modelProps, 'settings')).to.equal(true);
    });

    it('_getColumnName should return column name for not nested property', () => {
      expect(searchCtrl._getColumnName('price')).to.equal('"price"');
    });

    it('_getColumnName should return json column fild query for nested property', () => {
      expect(searchCtrl._getColumnName('prop.nested')).to.equal(`"prop"->>'nested'`);
    });

    it('_getColumnName should return json column fild query for deep nested property', () => {
      expect(searchCtrl._getColumnName('prop.nested.deep')).to.equal(`"prop"->'nested'->>'deep'`);
    });

    it('_modelHaveProperty should return true if Model have property', () => {
      let properties = searchCtrl.baseModel.properties;
      expect(searchCtrl._modelHaveProperty(properties, 'settings')).to.equal(true);
      expect(searchCtrl._modelHaveProperty(properties, 'price')).to.equal(true);
    });

    it('_modelHaveProperty should return false if Model have no property', () => {
      let properties = searchCtrl.baseModel.properties;
      expect(searchCtrl._modelHaveProperty(properties, 'nonexistent')).to.equal(false);
    });
  });

  // TODO: add tests to check aggregate queries
  describe('builders: where options', function() {
    let searchCtrl;

    beforeEach(() => {
      searchCtrl = new Search(app.dataSources.postgres.connector, app, {baseModelName: 'TestProductOptions'});
    });

    it('_buildWhereQueryForProp should add NULL where condition when expression = null', () => {
      let conditionsList = [];
      searchCtrl._buildWhereQueryForProp(conditionsList, 'tableKey', '"columnName"', null);
      searchCtrl._buildWhereQueryForProp(conditionsList, 'tableKey', '"columnName"', {is: null});
      searchCtrl._buildWhereQueryForProp(conditionsList, 'tableKey', '"columnName"', {neq: null});

      let expectedNull = {
        column: '"tableKey"."columnName"',
        operator: 'IS NULL'
      };
      let expectedNotNull = {
        column: '"tableKey"."columnName"',
        operator: 'IS NOT NULL'
      };

      expect(conditionsList[0]).to.deep.equal(expectedNull);
      expect(conditionsList[1]).to.deep.equal(expectedNull);
      expect(conditionsList[2]).to.deep.equal(expectedNotNull);
    });

    it('_buildWhereQueryForProp should skip unknown expression', () => {
      let conditionsList = [];
      searchCtrl._buildWhereQueryForProp(conditionsList, 'tableKey', '"columnName"', {unknown: true});

      expect(conditionsList.length).to.equal(0);
    });

    it('_buildWhereQueryForProp should add "is" condition', () => {
      let conditionsList = [];
      searchCtrl._buildWhereQueryForProp(conditionsList, 'tableKey', '"columnName"', {is: 10});

      expect(conditionsList[0].operator).to.equal('=');
      expect(conditionsList[0].value).to.equal(10);
    });

    it('_buildWhereQueryForProp should add "neq" condition', () => {
      let conditionsList = [];
      searchCtrl._buildWhereQueryForProp(conditionsList, 'tableKey', '"columnName"', {neq: 10});

      expect(conditionsList[0].operator).to.equal('!=');
      expect(conditionsList[0].value).to.equal(10);
    });

    it('_buildWhereQueryForProp should add "gt" condition', () => {
      let conditionsList = [];
      searchCtrl._buildWhereQueryForProp(conditionsList, 'tableKey', '"columnName"', {gt: 10});

      expect(conditionsList[0].operator).to.equal('>');
      expect(conditionsList[0].value).to.equal(10);
    });

    it('_buildWhereQueryForProp should add "lt" condition', () => {
      let conditionsList = [];
      searchCtrl._buildWhereQueryForProp(conditionsList, 'tableKey', '"columnName"', {lt: 10});

      expect(conditionsList[0].operator).to.equal('<');
      expect(conditionsList[0].value).to.equal(10);
    });

    it('_buildWhereQueryForProp should add "gte" condition', () => {
      let conditionsList = [];
      searchCtrl._buildWhereQueryForProp(conditionsList, 'tableKey', '"columnName"', {gte: 10});

      expect(conditionsList[0].operator).to.equal('>=');
      expect(conditionsList[0].value).to.equal(10);
    });

    it('_buildWhereQueryForProp should add "lte" condition', () => {
      let conditionsList = [];
      searchCtrl._buildWhereQueryForProp(conditionsList, 'tableKey', '"columnName"', {lte: 10});

      expect(conditionsList[0].operator).to.equal('<=');
      expect(conditionsList[0].value).to.equal(10);
    });

    it('_buildWhereQueryForProp should add "is" condition if expression is not object', () => {
      let conditionsList = [];
      searchCtrl._buildWhereQueryForProp(conditionsList, 'tableKey', '"columnName"', 10);

      expect(conditionsList[0].operator).to.equal('=');
      expect(conditionsList[0].value).to.equal(10);
    });
  });

  describe('builders: models options', function() {
    let searchCtrl;

    before(() => {
      searchCtrl = new Search(app.dataSources.postgres.connector, app, {baseModelName: 'TestProduct'});
    });

    it('should collect base model options', () => {
      expect(searchCtrl.baseModel).to.be.a('object');
      expect(searchCtrl.baseModel.tableKey).to.equal('TestProduct');
      expect(searchCtrl.baseModel.modelName).to.equal('TestProduct');
      expect(searchCtrl.baseModel.schema).to.equal('test');
      expect(searchCtrl.baseModel.isBase).to.equal(true);
      expect(searchCtrl.baseModel.modelDefinition).to.be.a('object');
      expect(searchCtrl.baseModel.properties).to.be.a('object');
      expect(searchCtrl.baseModel.relation).to.be.undefined;
    });

    it('should collect related model options', () => {
      const modelOptions = searchCtrl._getOptionsForModel(app.models, 'category', searchCtrl.baseModel);

      expect(modelOptions).to.be.a('object');
      expect(modelOptions.tableKey).to.equal('category');
      expect(modelOptions.modelName).to.equal('TestCategory');
      expect(modelOptions.schema).to.equal('test');
      expect(modelOptions.isBase).to.equal(false);
      expect(modelOptions.modelDefinition).to.be.a('object');
      expect(modelOptions.properties).to.be.a('object');
      expect(modelOptions.relation).to.be.a('object');
    });

    it('should collect related model relation options for hasOne relation', () => {
      const modelOptions = searchCtrl._getOptionsForModel(app.models, 'category', searchCtrl.baseModel);

      expect(modelOptions.relation).to.be.a('object');
      expect(modelOptions.relation.keyFrom).to.equal('categoryId');
      expect(modelOptions.relation.keyTo).to.equal('id');
      expect(modelOptions.relation.keyThrough).to.be.undefined;
    });

    it('should collect related model relation options for belongsTo relation', () => {
      const modelOptions = searchCtrl._getOptionsForModel(app.models, 'productOptions', searchCtrl.baseModel);

      expect(modelOptions.relation).to.be.a('object');
      expect(modelOptions.relation.keyFrom).to.equal('id');
      expect(modelOptions.relation.keyTo).to.equal('productId');
      expect(modelOptions.relation.keyThrough).to.be.undefined;
    });

    it('should collect related model relation options for hasMany Through relation', () => {
      const modelOptions = searchCtrl._getOptionsForModel(app.models, 'locations', searchCtrl.baseModel);

      expect(modelOptions.relation).to.be.a('object');
      expect(modelOptions.relation.keyFrom).to.equal('id');
      expect(modelOptions.relation.keyTo).to.equal('productId');
      expect(modelOptions.relation.keyThrough).to.equal('locationId');
      expect(modelOptions.relation.tableThrough).to.be.a('object');
      expect(modelOptions.relation.tableThrough.tableName).to.equal('test_location_to_product');
      expect(modelOptions.relation.tableThrough.schema).to.equal('test');
      expect(modelOptions.relation.tableThrough.properties).to.be.a('object');
    });

    it('_isModelRelated should return true if models are related', () => {
      let Model = searchCtrl.baseModel.Model;

      expect(searchCtrl._isModelRelated(Model, 'locations')).to.equal(true);
      expect(searchCtrl._isModelRelated(Model, 'category')).to.equal(true);
      expect(searchCtrl._isModelRelated(Model, 'productOptions')).to.equal(true);

      expect(searchCtrl._isModelRelated(Model, 'notRelatedModelName')).to.equal(false);
    });
  });

  describe('builders: where queries', function() {
    let searchCtrl;

    beforeEach(() => {
      searchCtrl = new Search(app.dataSources.postgres.connector, app, {baseModelName: 'TestProduct'});
    });

    it('_buildWhereStrings should set "WHERE" keyword for first condition', () => {
      let whereValue = {
        column: '"columnName"',
        operator: '=',
        value: 'value'
      };
      let sql = searchCtrl._buildWhereStrings(whereValue, 0);

      expect(sql).to.be.a('string');
      expect(sql).to.equal(' WHERE "columnName" = $1');
    });

    it('_buildWhereStrings should set "AND" keyword if other conditions already processed', () => {
      let whereValue = {
        column: '"columnName"',
        operator: '=',
        value: 'value'
      };
      searchCtrl._getJoinKey();
      let sql = searchCtrl._buildWhereStrings(whereValue, 1);

      expect(sql).to.be.a('string');
      expect(sql).to.equal(' AND "columnName" = $1');
    });

    it('_buildWhereStrings should set "AND" keyword for other conditions', () => {
      let whereValues = [{
        column: '"columnName"',
        operator: '=',
        value: 'value'
      }, {
        column: '"anotherColumnName"',
        operator: '!=',
        value: 'anotherValue'
      }];
      let sql = '';
      whereValues.forEach((value, i) => {
        sql += searchCtrl._buildWhereStrings(value, i);
      });

      expect(sql).to.be.a('string');
      expect(sql).to.equal(' WHERE "columnName" = $1 AND "anotherColumnName" != $2');
    });

    it('_buildWhereStrings should add "OR" query', () => {
      let whereValues = {
        or: [[{
          column: '"columnName"',
          operator: '=',
          value: 'value'
        }, {
          column: '"anotherColumnName"',
          operator: '=',
          value: 'another'
        }]]
      };
      searchCtrl._getJoinKey();
      let sql = searchCtrl._buildWhereForValues(whereValues);

      expect(sql).to.be.a('string');
      expect(sql).to.equal(' (  "columnName" = $1 AND "anotherColumnName" = $2 ) ');
    });

    it('_buildWhereStrings should add value to replacements array', () => {
      let whereValue = {
        column: '"columnNameOne"',
        operator: '=',
        value: 'value'
      };
      let sql = searchCtrl._buildWhereStrings(whereValue);

      expect(searchCtrl.replacements.length).to.equal(1);
      expect(searchCtrl.replacements[0]).to.equal('value');

      let anotherWhereValues = [{
        column: '"columnNameTwo"',
        operator: '=',
        value: false
      }, {
        column: '"columnNameThree"',
        operator: '=',
        value: 2
      }];
      anotherWhereValues.forEach(value => {
        sql += searchCtrl._buildWhereStrings(value);
      });

      expect(searchCtrl.replacements.length).to.equal(3);
      expect(searchCtrl.replacements[1]).to.equal(false);
      expect(searchCtrl.replacements[2]).to.equal(2);

      expect(sql).to.be.a('string')
        .to.include('$1')
        .to.include('$2')
        .to.include('$3');
    });
  });

  describe('builders: joins', function() {
    let searchCtrl;

    beforeEach(() => {
      searchCtrl = new Search(app.dataSources.postgres.connector, app, {baseModelName: 'TestProduct'});
    });

    it('_buildJoinQueryHas should return select sql', () => {
      let sql = searchCtrl._buildSelectQuery(searchCtrl.baseModel);
      expect(sql).to.equal('SELECT "TestProduct".* FROM "test"."test_product" as "TestProduct" ');
    });

    it('_buildJoinQueryHas should return join has sql', () => {
      const relatedOptions = searchCtrl._getOptionsForModel(app.models, 'category', searchCtrl.baseModel);
      let sql = searchCtrl._buildJoinQueryHas(relatedOptions);

      let expected = ` LEFT OUTER JOIN "test"."test_category" AS "category"` +
        ` ON "category"."id" = "TestProduct"."categoryId"`;

      expect(sql).to.equal(expected);
    });

    it('_buildJoinQueryHas should return join has sql with deleted_at key', () => {
      const relatedOptions = searchCtrl._getOptionsForModel(app.models, 'productOptions', searchCtrl.baseModel);
      let sql = searchCtrl._buildJoinQueryHas(relatedOptions);

      let expected = ` LEFT OUTER JOIN "test"."test_product_options" AS "productOptions"` +
        ` ON "productOptions"."productId" = "TestProduct"."id"` +
        ` AND "productOptions"."deleted_at" IS NULL`;

      expect(sql).to.equal(expected);
    });

    it('_buildJoinQueryThrough should return join has through sql', () => {
      const relatedOptions = searchCtrl._getOptionsForModel(app.models, 'locations', searchCtrl.baseModel);
      let sql = searchCtrl._buildJoinQueryThrough(relatedOptions);

      let expected = ` LEFT OUTER JOIN "test"."test_location_to_product" AS "test_location_to_product"` +
        ` ON "test_location_to_product"."productId" = "TestProduct"."id"` +
        ` LEFT OUTER JOIN "test"."test_location" AS "locations"` +
        ` ON "test_location_to_product"."locationId" = "locations"."id"`;

      expect(sql).to.equal(expected);
    });
  });

  describe('builders: limit order offset', function() {
    let searchCtrl;

    beforeEach(() => {
      searchCtrl = new Search(app.dataSources.postgres.connector, app, {baseModelName: 'TestProduct'});
    });

    it('_buildLimitOffsetQuery should return sql with limit and offset', () => {
      let sql = searchCtrl._buildLimitOffsetQuery({ limit: 3, offset: 1 });
      expect(sql).to.equal(` LIMIT 3 OFFSET 1`);
    });

    it('_buildLimitOffsetQuery should set default values', () => {
      let sql = searchCtrl._buildLimitOffsetQuery({});
      expect(sql).to.equal(` LIMIT 10 OFFSET 0`);
    });

    it('_buildLimitOffsetQuery should parseInt string values', () => {
      let sql = searchCtrl._buildLimitOffsetQuery({ limit: '3', offset: '1' });
      expect(sql).to.equal(` LIMIT 3 OFFSET 1`);
    });

    it('_buildLimitOffsetQuery should replace incorrect values with default', () => {
      let sql = searchCtrl._buildLimitOffsetQuery({ limit: 'limit', offset: null });
      expect(sql).to.equal(` LIMIT 10 OFFSET 0`);

      sql = searchCtrl._buildLimitOffsetQuery({ limit: {limit: 1}, offset: [] });
      expect(sql).to.equal(` LIMIT 10 OFFSET 0`);
    });

    it('_buildOrderQueryString should bulid order query', () => {
      let sql = searchCtrl._buildOrderQueryString(searchCtrl.baseModel, 'quantity DESC');
      expect(sql).to.equal('"TestProduct"."quantity" DESC');
    });

    it('_buildOrderQueryString should requrn null if column not exist', () => {
      let sql = searchCtrl._buildOrderQueryString(searchCtrl.baseModel, 'nonexistent DESC');
      expect(sql).to.equal(null);
    });

    it('_buildOrderQueryString should requrn null if incorrect sort order', () => {
      let sql = searchCtrl._buildOrderQueryString(searchCtrl.baseModel, 'quantity LEFT');
      expect(sql).to.equal(null);
    });

    it('_buildOrderQuery should bulid order query', () => {
      let sql = searchCtrl._buildOrderQuery(searchCtrl.baseModel, ['quantity DESC']);
      expect(sql).to.equal(' ORDER BY "TestProduct"."quantity" DESC');
    });

    it('_buildOrderQuery should bulid multiple order query', () => {
      let sql = searchCtrl._buildOrderQuery(searchCtrl.baseModel, ['id ASC', 'quantity DESC']);
      expect(sql).to.equal(' ORDER BY "TestProduct"."id" ASC, "TestProduct"."quantity" DESC');
    });

    it('_buildOrderQuery should bulid default order query', () => {
      let sql = searchCtrl._buildOrderQuery(searchCtrl.baseModel);
      expect(sql).to.equal(' ORDER BY "TestProduct"."id" DESC');
    });
  });

  describe('run', function() {
    let searchCtrl;
    const multiModelQuery = {
      where: {
        productOptions: {
          price: 7
        },
        locations: {
          name: 'test'
        },
        type: 'test'
      }
    };

    beforeEach(() => {
      searchCtrl = new Search(app.dataSources.postgres.connector, app, {baseModelName: 'TestProduct'});
    });

    it('_validateFilter should be called once', () => {
      let spy = sinon.spy(searchCtrl, '_validateFilter');
      searchCtrl.buildQuery({});
      sinon.assert.calledOnce(spy);
    });

    it('_buildWhereQuery should be called once', () => {
      let spy = sinon.spy(searchCtrl, '_buildWhereQuery');
      searchCtrl.buildQuery({});
      sinon.assert.calledOnce(spy);
    });

    it('_buildOrderQuery should be called once', () => {
      let spy = sinon.spy(searchCtrl, '_buildOrderQuery');
      searchCtrl.buildQuery({});
      sinon.assert.calledOnce(spy);
    });

    it('_buildLimitOffsetQuery should be called once', () => {
      let spy = sinon.spy(searchCtrl, '_buildLimitOffsetQuery');
      searchCtrl.buildQuery({});
      sinon.assert.calledOnce(spy);
    });

    it('_buildIncludesQuery should be called once', () => {
      let spy = sinon.spy(searchCtrl, '_buildIncludesQuery');
      searchCtrl.buildQuery({});
      sinon.assert.calledOnce(spy);
    });

    it('_modelHaveProperty should be called for all properties', () => {
      let spy = sinon.spy(searchCtrl, '_modelHaveProperty');
      searchCtrl.buildQuery({where: {id: 2, type: 'test', quantity: {gt: 2}}});
      sinon.assert.callCount(spy, 3);
    });

    it('_isModelRelated should be called for all properties that is not in base model', () => {
      let spy = sinon.spy(searchCtrl, '_isModelRelated');
      searchCtrl.buildQuery({where: {unexistent: 2, type: 'test', quantity: 5}});
      sinon.assert.calledOnce(spy);
    });

    it('_buildQueryForModel should be called for all models that a queried', () => {
      let spy = sinon.spy(searchCtrl, '_buildQueryForModel');
      searchCtrl.buildQuery(multiModelQuery);
      sinon.assert.callCount(spy, 3);
    });

    it('_buildSelectQuery _buildJoinQuery should be called for models', () => {
      let spySelect = sinon.spy(searchCtrl, '_buildSelectQuery');
      let spyJoin = sinon.spy(searchCtrl, '_buildJoinQuery');
      searchCtrl.buildQuery(multiModelQuery);

      sinon.assert.callCount(spySelect, 1);
      sinon.assert.callCount(spyJoin, 2);
    });

    it('_buildWhereStrings should be called for all models with where conditions', () => {
      let spy = sinon.spy(searchCtrl, '_buildWhereStrings');
      searchCtrl.buildQuery(multiModelQuery);
      sinon.assert.callCount(spy, 3);
    });

    it('_buildWhereStrings should be skipped for all models without where conditions', () => {
      let query = {...multiModelQuery};
      delete query.where.type;

      let spy = sinon.spy(searchCtrl, '_buildWhereStrings');
      searchCtrl.buildQuery(query);
      sinon.assert.callCount(spy, 2);
    });

    it('_buildJoinQueryThrough should be called for model with HasManyThrough relaiton', () => {
      const query = {
        where: {
          locations: {
            name: 'test'
          }
        }
      };

      let spy = sinon.spy(searchCtrl, '_buildJoinQueryThrough');
      searchCtrl.buildQuery(query);
      sinon.assert.calledOnce(spy);
    });

    it('_buildJoinQueryHas should be called for model with Has or belongsTo relaiton', () => {
      const query = {
        where: {
          productOptions: {
            price: 7
          },
          category: {
            name: 'test'
          }
        }
      };

      let spy = sinon.spy(searchCtrl, '_buildJoinQueryHas');
      searchCtrl.buildQuery(query);
      sinon.assert.calledTwice(spy);
    });

    it('_query should be called', () => {
      let queryStub = sinon.stub(searchCtrl, '_query');

      searchCtrl.query({});
      sinon.assert.calledOnce(queryStub);
    });

    it('_query should be called with correct args', () => {
      const query = {
        where: {
          type: 'test',
          quantity: 2
        }
      };
      let queryStub = sinon.stub(searchCtrl, '_query');

      searchCtrl.query(query);
      let [sql, replacements] = queryStub.getCall(0).args;

      expect(replacements).to.deep.equal(['test', 2]);
      expect(sql).to.be.a('string')
        .to.include('"type" = $1')
        .to.include('"quantity" = $2');
    });
  });
});
