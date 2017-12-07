'use strict';

import Promise from 'bluebird';

import FeedSearch from '../lib/search';

module.exports = function(SavedFeed) {
  SavedFeed.search = async function(filters) {
    return await searchSavedFeeds(SavedFeed.app.dataSources.postgres, SavedFeed.app, filters);
  };

  SavedFeed.remoteMethod(
    'search',
    {
      description: 'Search by feed criterion.',
      accepts: [
        {arg: 'filters', type: 'object', required: true}
      ],
      returns: { arg: 'filters', type: 'Array', root: true},
      http: {verb: 'get', path: '/search'}
    }
  );

  async function searchSavedFeeds(dataSource, app, filters) {
    const feedSearch = new FeedSearch(dataSource.connector, app);
    return await feedSearch.query(filters);
  }
};
