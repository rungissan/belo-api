'use strict';

import Promise from 'bluebird';

import FeedSearch from '../lib/search/feed';

module.exports = function(SavedFeed) {
  SavedFeed.search = async function(filter) {
    filter.where = formatFeedQuery(filter.where);
    return await searchSavedFeeds(SavedFeed.app.dataSources.postgres, SavedFeed.app, filter);
  };

  SavedFeed.remoteMethod(
    'search',
    {
      description: 'Search by feed criterion.',
      accepts: [
        {arg: 'filter', type: 'object', required: true}
      ],
      returns: { arg: 'filters', type: 'Array', root: true},
      http: {verb: 'get', path: '/search'}
    }
  );

  SavedFeed.prototype.getFeeds = async function(filterQuery = {}) {
    let feed = this;
    let where = formatFeedQuery(getSearchFilter(feed));
    let filter = {
      where,
      limit: filterQuery.limit,
      offset: filterQuery.offset,
      order: filterQuery.order,
      include: filterQuery.include
    };

    return await searchSavedFeeds(SavedFeed.app.dataSources.postgres, SavedFeed.app, filter);
  };

  SavedFeed.remoteMethod(
    'prototype.getFeeds',
    {
      description: 'Get feeds by saved filters.',
      accepts: [
        { arg: 'filter', type: 'object', http: { source: 'query' } }
      ],
      returns: { arg: 'feeds', type: 'Array', root: true},
      http: {verb: 'get', path: '/get-feeds'}
    }
  );

  async function searchSavedFeeds(dataSource, app, filter) {
    const feedSearch = new FeedSearch(dataSource.connector, app, {baseModelName: 'Feed'});
    return await feedSearch.query(filter);
  }

  const BASE_FILTERS = ['type', 'displayAddress', 'showInBrokerFeed'];

  function getSearchFilter(feed) {
    let where = {
      geolocations: feed.geolocations,
      feedOptions: feed.feedOptions,
      openHouse: feed.openHouse,
      additionalFilters: feed.additionalFilters
    };

    BASE_FILTERS.forEach(filter => {
      if (feed[filter] !== null) {
        where[filter] = feed[filter];
      }
    });

    return where;
  }

  /**
   * @desc Build where query for multiple geolocations or feed types.
   * This need only to simplify api.
   * @param {Integer} [length]
   * @param {String} [alphabet]
   * @returns {String}
   */
  function formatFeedQuery(where) {
    if (!where) {
      return where;
    }

    let aggQuery;

    if (Array.isArray(where.geolocations)) {
      aggQuery = {
        or: where.geolocations.map(query => ({geolocations: query}))
      };
      delete where.geolocations;
    }

    if (typeof where.feedOptions !== 'undefined') {
      if (!where.type) {
        if (aggQuery) {
          aggQuery = {
            and: [
              {or: [{feedOptions: where.feedOptions}, { type: 'post'}] },
              aggQuery
            ]
          };
        } else {
          aggQuery = {or: [{feedOptions: where.feedOptions}, { type: 'post'}] };
        }
      }
      delete where.feedOptions;
    }

    if (aggQuery) {
      where = {...where, ...aggQuery};
    }

    return where;
  }
};
