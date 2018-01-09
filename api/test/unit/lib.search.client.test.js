'use strict';
/* eslint-disable no-unused-expressions */

import { expect } from 'chai';
import Promise from 'bluebird';
import sinon from 'sinon';

import app from '../../server/server';
import ClientSearch from '../../server/lib/search/client';
import MODELS from '../mocks/search-models';

describe('ClientSearch', function() {
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

  describe('run', function() {
    let searchCtrl;
    const query = {
      where: {
        searchString: 'test search'
      }
    };

    beforeEach(() => {
      searchCtrl = new ClientSearch(app.dataSources.postgres.connector, app, {
        baseModelName: 'TestProduct',
        fulltextSearchFields: ['description', 'quantity']
      });
    });

    it('buildAdditionalWhereQuery should be called once', () => {
      let spy = sinon.spy(searchCtrl, 'buildAdditionalWhereQuery');
      searchCtrl.buildQuery(query);
      sinon.assert.calledOnce(spy);
    });

    it('buildAdditionalWhereQuery should be add full text search qeury', () => {
      searchCtrl.filter = query;
      let buildedQuery = searchCtrl.buildAdditionalWhereQuery();

      expect(buildedQuery).to.equal(` WHERE to_tsvector("description" || ' ' || "quantity") @@ plainto_tsquery($1)`);
      expect(searchCtrl.replacements[0]).to.equal('test search');
    });
  });
});
