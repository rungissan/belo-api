'use strict';

import Promise from 'bluebird';

import FeedSearch from '../lib/search/feed';

module.exports = function(SavedFeed) {
  SavedFeed.search = async function(filter) {
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

  async function searchSavedFeeds(dataSource, app, filter) {
    const feedSearch = new FeedSearch(dataSource.connector, app);
    return await feedSearch.query(filter);
  }
};
