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
    propertyType: {
      type: 'string'
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
      outdoorSpace: {
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
      bikeRoom: {
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
      firstMonthRent: {
        name: 'First Month Rent',
        type: 'boolean'
      },
      lastMonthRent: {
        name: 'Last Month Rent',
        type: 'boolean'
      },
      securityDeposit: {
        name: 'Sequrity Deposit',
        type: 'number'
      },
      applicationFee: {
        name: 'Application Fee',
        type: 'number'
      },
      brokerFee: {
        name: 'Broker Fee',
        type: 'number'
      }
    }
  },
  schoolInformation: {
    type: 'object',
    additionalProperties: false,
    properties: {
      custom: {
        type: 'array'
      }
    }
  },
  transportation: {
    type: 'object',
    additionalProperties: false,
    properties: {
      custom: {
        type: 'array'
      }
    }
  },
  additionalFeatures: {
    type: 'object'
  }
};

module.exports = function(Feed) {
  Feed.validatesInclusionOf('type', {in: ['post', 'listing', 'openHouse']});

  Feed.beforeRemote('create', getBeforeSaveHook());
  Feed.beforeRemote('prototype.patchAttributes', getBeforeSaveHook({type: 'update'}));

  Feed.afterRemote('create', afterSaveHook);
  Feed.afterRemote('prototype.patchAttributes', afterSaveHook);

  Feed.prototype.setOpenHouse = async function(ctx, openHouseData) {
    const token = ctx.req.accessToken;
    const userId = token && token.userId;
    let feed = this;

    if (!(feed && feed.id) || !userId) {
      return;
    }

    if (feed.type !== 'listing') {
      throw errValidation('Open house can be created only for listing');
    }

    const { OpenHouse, Attachment, AttachmentToOpenHouse } = Feed.app.models;
    let openHouse;

    if (feed.openHouseId) {
      await OpenHouse.updateAll({id: feed.openHouseId}, openHouseData);
    } else {
      openHouseData.userId = userId;
      openHouse = await OpenHouse.create(openHouseData);
      await feed.updateAttributes({openHouseId: openHouse.id});
    }

    if (openHouseData.images && openHouseData.images.length) {
      if (!openHouse) {
        openHouse = await OpenHouse.findById(feed.openHouseId);
      }

      await Promise.map(openHouseData.images, async imageId => {
        imageId = Number(imageId);
        if (!imageId) {
          return false;
        }

        let relationInstance =  await Attachment.findById(imageId);
        if (!relationInstance) {
          return false;
        }

        if (!(relationInstance.userId && relationInstance.userId == userId)) {
          return false;
        }

        let attachmentLinkData = {
          attachmentId: imageId,
          openHouseId: openHouse.id
        };

        let attachmentToOpenHouse = await AttachmentToOpenHouse.findOne({where: attachmentLinkData});
        if (!attachmentToOpenHouse) {
          AttachmentToOpenHouse.create({attachmentId: imageId, openHouseId: openHouse.id}, {accessToken: token});
        }
        return;
      });
    }

    return openHouse || openHouseData;
  };

  const OPEN_HOUSE_ACCEPTS = [
    { arg: 'ctx',    type: 'object', http: { source: 'context' } },
    {
      arg: 'openHouse',
      type: 'object',
      required: true,
      http: { source: 'body' }
    }
  ];
  const OPEN_HOUSE_RETURNS = { arg: 'data', type: 'OpenHouse', root: true};

  Feed.remoteMethod(
    'prototype.setOpenHouse',
    {
      description: 'Create/update open house for listing.',
      accepts: OPEN_HOUSE_ACCEPTS,
      returns: OPEN_HOUSE_RETURNS,
      http: {verb: 'post', path: '/open-house'}
    }
  );

  Feed.prototype.deleteOpenHouse = async function() {
    let feed = this;

    if (!(feed && feed.openHouseId)) {
      return;
    }

    const OpenHouse = Feed.app.models.OpenHouse;

    return await OpenHouse.destroyById(feed.openHouseId);
  };

  Feed.remoteMethod(
    'prototype.deleteOpenHouse',
    {
      description: 'Delete open house for listing.',
      http: {verb: 'delete', path: '/open-house'}
    }
  );

  function getBeforeSaveHook(options = {}) {
    return async function beforeSaveHook(ctx, modelInstance) {
      let feed = ctx.args.instance || ctx.args.data;
      if (!feed) {
        return;
      }

      if ((options.type === 'update') && (typeof feed.type !== 'undefined')) {
        throw errValidation('type can not be changed');
      }

      if (feed.options) {
        if (feed.type === 'post') {
          throw errValidation('"options" allowed only for Listings');
        }

        await validateBySchema(feed.options, FEATURES_OPTIONS, 'Feed');
        await validateFeedOptions(feed.options);
      }

      return feed;
    };
  }

  async function afterSaveHook(ctx, feed) {
    let body = ctx.req.body;

    if (!feed || !body.options) {
      return;
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
