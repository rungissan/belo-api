'use strict';

import BaseSearchController from './index';

const debug = require('debug')('spiti:feed:search');

const MODELS = [
  { name: 'feed', model: 'Feed' },
  { name: 'favoriteFeeds', model: 'FavoriteFeed', isBase: true }
];

export default class FeedSearch extends BaseSearchController {
  constructor(connector, app, options = {}) {
    options.MODELS = MODELS;
    super(connector, app, options);
  }
};
