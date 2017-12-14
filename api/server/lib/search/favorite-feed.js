'use strict';

import BaseSearchController from './index';

export default class FeedSearch extends BaseSearchController {
  constructor(connector, app, options = {}) {
    super(connector, app, options);
  }
};
