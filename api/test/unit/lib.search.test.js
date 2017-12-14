'use strict';
/* eslint-disable no-unused-expressions */

import { expect } from 'chai';
import Promise from 'bluebird';
import { join } from 'path';

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

  describe('builders: where options', function() {
    let searchCtrl;

    beforeEach(() => {
      searchCtrl = new Search(app.dataSources.postgres.connector, app, {baseModelName: 'TestProductOptions'});
    });

    it('_buildWhereQueryForProp should add NULL where condition when expression = null', () => {
      searchCtrl.whereValues = {tableKey: []};
      searchCtrl._buildWhereQueryForProp('tableKey', '"columnName"', null);
      searchCtrl._buildWhereQueryForProp('tableKey', '"columnName"', {is: null});
      searchCtrl._buildWhereQueryForProp('tableKey', '"columnName"', {neq: null});

      let expectedNull = {
        column: '"tableKey"."columnName"',
        operator: 'IS NULL'
      };
      let expectedNotNull = {
        column: '"tableKey"."columnName"',
        operator: 'IS NOT NULL'
      };

      expect(searchCtrl.whereValues.tableKey[0]).to.deep.equal(expectedNull);
      expect(searchCtrl.whereValues.tableKey[1]).to.deep.equal(expectedNull);
      expect(searchCtrl.whereValues.tableKey[2]).to.deep.equal(expectedNotNull);
    });

    it('_buildWhereQueryForProp should skip unknown expression', () => {
      searchCtrl.whereValues = {tableKey: []};
      searchCtrl._buildWhereQueryForProp('tableKey', '"columnName"', {unknown: true});

      expect(searchCtrl.whereValues.tableKey.length).to.equal(0);
    });

    it('_buildWhereQueryForProp should add "is" condition', () => {
      searchCtrl.whereValues = {tableKey: []};
      searchCtrl._buildWhereQueryForProp('tableKey', '"columnName"', {is: 10});

      expect(searchCtrl.whereValues.tableKey[0].operator).to.equal('=');
      expect(searchCtrl.whereValues.tableKey[0].value).to.equal(10);
    });

    it('_buildWhereQueryForProp should add "neq" condition', () => {
      searchCtrl.whereValues = {tableKey: []};
      searchCtrl._buildWhereQueryForProp('tableKey', '"columnName"', {neq: 10});

      expect(searchCtrl.whereValues.tableKey[0].operator).to.equal('!=');
      expect(searchCtrl.whereValues.tableKey[0].value).to.equal(10);
    });

    it('_buildWhereQueryForProp should add "gt" condition', () => {
      searchCtrl.whereValues = {tableKey: []};
      searchCtrl._buildWhereQueryForProp('tableKey', '"columnName"', {gt: 10});

      expect(searchCtrl.whereValues.tableKey[0].operator).to.equal('>');
      expect(searchCtrl.whereValues.tableKey[0].value).to.equal(10);
    });

    it('_buildWhereQueryForProp should add "lt" condition', () => {
      searchCtrl.whereValues = {tableKey: []};
      searchCtrl._buildWhereQueryForProp('tableKey', '"columnName"', {lt: 10});

      expect(searchCtrl.whereValues.tableKey[0].operator).to.equal('<');
      expect(searchCtrl.whereValues.tableKey[0].value).to.equal(10);
    });

    it('_buildWhereQueryForProp should add "gte" condition', () => {
      searchCtrl.whereValues = {tableKey: []};
      searchCtrl._buildWhereQueryForProp('tableKey', '"columnName"', {gte: 10});

      expect(searchCtrl.whereValues.tableKey[0].operator).to.equal('>=');
      expect(searchCtrl.whereValues.tableKey[0].value).to.equal(10);
    });

    it('_buildWhereQueryForProp should add "lte" condition', () => {
      searchCtrl.whereValues = {tableKey: []};
      searchCtrl._buildWhereQueryForProp('tableKey', '"columnName"', {lte: 10});

      expect(searchCtrl.whereValues.tableKey[0].operator).to.equal('<=');
      expect(searchCtrl.whereValues.tableKey[0].value).to.equal(10);
    });

    it('_buildWhereQueryForProp should add "is" condition if expression is not object', () => {
      searchCtrl.whereValues = {tableKey: []};
      searchCtrl._buildWhereQueryForProp('tableKey', '"columnName"', 10);

      expect(searchCtrl.whereValues.tableKey[0].operator).to.equal('=');
      expect(searchCtrl.whereValues.tableKey[0].value).to.equal(10);
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
      expect(modelOptions.relation.keyFrom).to.equal('id');
      expect(modelOptions.relation.keyTo).to.equal('categoryId');
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
      expect(modelOptions.relation.tableThrough.tableName).to.equal('test_location');
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
});
