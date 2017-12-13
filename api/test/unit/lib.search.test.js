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
});
