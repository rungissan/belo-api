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
    });
  });

  after(() => {});

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

  it('should successfully initialise', () => {
    expect(() => {
      new Search(app.dataSources.postgres.connector, app);
    }).not.to.throw('app is required');
  });
});
