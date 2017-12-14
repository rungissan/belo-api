'use strict';

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
  });

  describe('builders: where options', function() {
    let searchCtrl;

    beforeEach(() => {
      searchCtrl = new Search(app.dataSources.postgres.connector, app, {baseModelName: 'TestProductOptions'});
    });

    it('_buildWhereQueryForProp should add "IS NULL" where expression', () => {
      searchCtrl.whereValues = {tableKey: []};
      searchCtrl._buildWhereQueryForProp('tableKey', '"columnName"', null);

      let expected = {
        column: '"tableKey"."columnName"',
        operator: 'IS NULL'
      };

      expect(searchCtrl.whereValues.tableKey).to.deep.equal([expected]);
    });
  });
});
