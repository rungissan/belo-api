'use strict';

import Promise from 'bluebird';

import { validateBySchema } from '../lib/validate';
import { errValidation } from '../lib/errors';

const FEATURES_OPTIONS = {
  type: 'object',
  additionalProperties: false,
  properties: {
    rentType: {
      type: 'string',
      enum: ['rent', 'sale']
    },
    bedrooms: {
      type: 'integer',
      minimum: 0,
      maximum: 100
    },
    bathrooms: {
      type: 'integer',
      minimum: 0,
      maximum: 100
    },
    price: {
      type: 'integer',
      minimum: 0
    },
    square: {
      type: 'number'
    },
    propertyFeatures: {
      type: 'object'
    },
    buildingFeatures: {
      type: 'object'
    },
    utilitiesIncluded: {
      type: 'object'
    },
    moveInFees: {
      type: 'object'
    },
    schoolInformation: {
      type: 'object'
    },
    transportation: {
      type: 'object'
    },
    additionalFeatures: {
      type: 'object'
    }
  },
  required: ['rentType', 'bedrooms', 'bathrooms', 'price', 'square']
};

const FEATURES_VALIDATIONS = {
  propertyFeatures: {
    type: 'object',
    additionalProperties: false,
    properties: {
      laundry: {
        name: 'Laundry',
        type: 'boolean'
      },
      dogs: {
        name: 'Dogs OK',
        type: 'boolean'
      },
      cats: {
        name: 'Cats OK',
        type: 'boolean'
      },
      parking: {
        name: 'Parking',
        type: 'boolean'
      },
      fireplace: {
        name: 'Fireplace',
        type: 'boolean'
      },
      outdoor_space: {
        name: 'Outdoor Space',
        type: 'boolean'
      }
    }
  },
  buildingFeatures: {
    type: 'object',
    additionalProperties: false,
    properties: {
      fitness: {
        name: 'Fitness',
        type: 'boolean'
      },
      pool: {
        name: 'Pool',
        type: 'boolean'
      },
      elevator: {
        name: 'Elevator',
        type: 'boolean'
      },
      bike_room: {
        name: 'Bike Room',
        type: 'boolean'
      },
      storage: {
        name: 'Storage',
        type: 'boolean'
      },
      doorman: {
        name: 'Doorman',
        type: 'boolean'
      }
    }
  },
  utilitiesIncluded: {
    type: 'object',
    additionalProperties: false,
    properties: {
      electric: {
        name: 'Electric',
        type: 'boolean'
      },
      heat: {
        name: 'Heat',
        type: 'boolean'
      },
      gas: {
        name: 'Gas',
        type: 'boolean'
      },
      sewer: {
        name: 'Sewer',
        type: 'boolean'
      },
      water: {
        name: 'Water',
        type: 'boolean'
      },
      garbage: {
        name: 'Garbage',
        type: 'boolean'
      }
    }
  },
  moveInFees: {
    type: 'object',
    additionalProperties: false,
    properties: {
      first_month_rent: {
        name: 'First Month Rent',
        type: 'boolean'
      },
      last_month_rent: {
        name: 'Last Month Rent',
        type: 'boolean'
      },
      security_deposit: {
        name: 'Sequrity Deposit',
        type: 'number'
      },
      application_fee: {
        name: 'Application Fee',
        type: 'number'
      },
      broker_fee: {
        name: 'Broker Fee',
        type: 'number'
      }
    }
  },
  schoolInformation: {},
  transportation: {},
  additionalFeatures: {
    type: 'object'
  }
};

module.exports = function(Feed) {
  Feed.validatesInclusionOf('type', {in: ['post', 'listing', 'openHouse']});

  Feed.beforeRemote('create', beforeSaveHook);
  Feed.beforeRemote('prototype.patchAttributes', beforeSaveHook);

  Feed.afterRemote('create', afterSaveHook);
  Feed.afterRemote('prototype.patchAttributes', afterSaveHook);

  async function beforeSaveHook(ctx, modelInstance) {
    let feed = ctx.args.instance || ctx.args.data;
    if (!feed) {
      return;
    }

    if (feed.options) {
      if (feed.type === 'post') {
        throw errValidation('"options" allowed only for Listings');
      }

      await validateBySchema(feed.options, FEATURES_OPTIONS, 'Feed');
      await validateFeedOptions(feed.options);
    }

    return feed;
  }

  async function afterSaveHook(ctx, feed) {
    let body = ctx.req.body;

    if (!feed || !body.options) {
      return
    }

    return await upsertFeedOptions(feed, body.options);
  }

  async function validateFeedOptions(feedOptions = {}) {
    return Promise.map(Object.keys(FEATURES_VALIDATIONS), key => {
      if (feedOptions[key]) {
        return validateBySchema(feedOptions[key], FEATURES_VALIDATIONS[key], 'FeedOptions');
      }
      return true;
    });
  }

  function upsertFeedOptions(feed, optionsData) {
    return new Promise((resolve, reject) => {
      feed.feedOptions((err, feedOptions) => {
        if (err) {
          return reject(err);
        }
        if (feedOptions) {
          feed.feedOptions.update(optionsData).then(resolve);
        } else {
          feed.feedOptions.create(optionsData).then(resolve);
        }
      });
    });
  }
};
