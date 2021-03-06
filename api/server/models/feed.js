'use strict';

import Promise from 'bluebird';
import path from 'path';
import {
  validateBySchema
} from '../lib/validate';
import {
  errValidation,
  errFeedNotFound,
  errAccessDenied

} from '../lib/errors';

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
      minimum: 0
      // maximum: 100
    },
    bathrooms: {
      type: 'integer',
      minimum: 0
      // maximum: 100
    },
    price: {
      type: 'integer',
      minimum: 0
    },
    square: {
      type: 'number'
    },
    propertyType: {
      type: 'string',
      enum: [
        'singleFamily',
        'condo',
        'coop',
        'townhome',
        'multiFamily',
        'landLot',
        'apartmentInBuilding'
      ]
    },
    propertyFeatures: {
      type: 'object'
    },
    noFee: {
      type: 'boolean'
    },
    hasOwner: {
      type: 'boolean'
    },
    keyDetails: {
      type: 'object'
    },
    utilitiesIncluded: {
      type: 'object'
    },
    moveInFees: {
      type: 'object'
    },
    feesAndCharges: {
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
  required: ['rentType', 'propertyType', 'bedrooms', 'bathrooms', 'price', 'square']
};

const FEATURES_VALIDATIONS = {
  propertyFeatures: {
    type: 'object',
    additionalProperties: false,
    properties: {
      style: {
        type: 'string',
        enum: [
          'Antique/Historic',
          '2 Family',
          '2 Story',
          '3 Family',
          '4 Family',
          '5+ Family',
          'Apartment Building',
          'Barn',
          'Bungalow',
          'Cape',
          'Co-op',
          'Colonial',
          'Commercial',
          'Condo',
          'Contemporary',
          'Coop',
          'Cottage',
          'Duplex',
          'Estate',
          'Exp Cape',
          'Exp Ranch',
          'Farm House',
          'Farm Ranch',
          'Hi Ranch',
          'House Boat',
          'Mediterranean',
          'Mixed',
          'Modern',
          'Multi Family',
          'Other',
          'Raised Ranch',
          'Ranch',
          'Residential',
          'Splanch',
          'Split',
          'Split Ranch ',
          'Townhome',
          'Townhouse',
          'Traditional',
          'Tudor',
          'Victorian'
        ]
      },
      yearBuilt: {
        type: 'number'
      },
      interiorSqFt: {
        type: 'number'
      },
      acres: {
        type: 'number'
      },
      totalNuberOfUnits: {
        type: 'number'
      },
      garage: {
        type: 'boolean'
      },
      garageParking: {
        type: 'boolean'
      },
      driveway: {
        type: 'boolean'
      },
      energyEfficient: {
        type: 'boolean'
      },
      reo: {
        type: 'boolean'
      },
      shortSale: {
        type: 'boolean'
      },
      yearlyOrSeasonal: {
        type: 'string',
        enum: ['Yearly', 'Seasonal']
      },
      lotSize: {
        type: 'string'
      }, // object?
      heatType: {
        type: 'string'
      },
      heatingZones: {
        type: 'number'
      },
      centralAirZones: {
        type: 'number'
      },
      schoolDistrict: {
        type: 'number'
      }
    }
  },

  keyDetails: {
    type: 'object',
    additionalProperties: false,
    properties: {
      laundry: {
        type: 'boolean'
      },
      waterfront: {
        type: 'boolean'
      },
      fireplace: {
        type: 'boolean'
      },
      woodFloors: {
        type: 'boolean'
      },
      centralAir: {
        type: 'boolean'
      },
      outdoorSpace: {
        type: 'boolean'
      },
      skylight: {
        type: 'boolean'
      },
      basement: {
        type: 'boolean'
      },
      finishedBasement: {
        type: 'boolean'
      },
      attic: {
        type: 'boolean'
      },
      yard: {
        type: 'boolean'
      },
      pool: {
        type: 'boolean'
      },
      sportsCourt: {
        type: 'boolean'
      },
      elevator: {
        type: 'boolean'
      },
      dogOK: {
        type: 'boolean'
      },
      catOK: {
        type: 'boolean'
      },
      furnished: {
        type: 'boolean'
      },
      inUnitLaundry: {
        type: 'boolean'
      },
      sharedLaundry: {
        type: 'boolean'
      },
      waterview: {
        type: 'boolean'
      },
      pvtOutdoorSpace: {
        type: 'boolean'
      },
      communalOutdoorSpace: {
        type: 'boolean'
      },
      conciergeDoorman: {
        type: 'boolean'
      },
      onSiteSuper: {
        type: 'boolean'
      },
      communalOutdoorArea: {
        type: 'boolean'
      },
      fitnessCenter: {
        type: 'boolean'
      },
      storageAvailable: {
        type: 'boolean'
      },
      bikeRoom: {
        type: 'boolean'
      },
      publicWater: {
        type: 'boolean'
      },
      wellWater: {
        type: 'boolean'
      },
      sewer: {
        type: 'boolean'
      },
      electric: {
        type: 'boolean'
      },
      gas: {
        type: 'boolean'
      },
      cleared: {
        type: 'boolean'
      },
      varianceNeeded: {
        type: 'boolean'
      }
    }
  },

  feesAndCharges: {
    type: 'object',
    additionalProperties: false,
    properties: {
      totalTaxes: {
        type: 'number'
      },
      maintenance: {
        type: 'number'
      },
      commonCharge: {
        type: 'number'
      },
      amenities: {
        type: 'number'
      },
      parking: {
        type: 'number'
      },
      utilities: {
        type: 'number'
      },
      insurance: {
        type: 'number'
      },
      miscExpenses: {
        type: 'number'
      },
      annualRentRoll: {
        type: 'number'
      },
      netIncome: {
        type: 'number'
      }
    }
  },

  moveInFees: {
    type: 'object',
    additionalProperties: false,
    properties: {
      firstMonthRent: {
        type: 'boolean'
      },
      lastMonthRent: {
        type: 'boolean'
      },
      securityDeposit: {
        type: 'number'
      },
      applicationFee: {
        type: 'number'
      },
      brokerFee: {
        type: 'number'
      }
    }
  },

  utilitiesIncluded: {
    type: 'object',
    additionalProperties: false,
    properties: {
      electric: {
        type: 'boolean'
      },
      water: {
        type: 'boolean'
      },
      cookingGas: {
        type: 'boolean'
      },
      heat: {
        type: 'boolean'
      },
      sewer: {
        type: 'boolean'
      },
      garbage: {
        type: 'boolean'
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
  Feed.validatesInclusionOf('type', { in: ['post', 'listing', 'openHouse']
  });

  Feed.beforeRemote('create', getBeforeSaveHook());
  Feed.beforeRemote('prototype.patchAttributes', getBeforeSaveHook({
    type: 'update'
  }));

  Feed.afterRemote('create', afterSaveHook);
  Feed.afterRemote('prototype.patchAttributes', afterSaveHook);
  Feed.afterRemote('find', includePopulates);
  // Feed.afterRemote('find', includeCounters);

  Feed.prototype.createOpenHouse = async function(ctx, openHouseData) {
    const token = ctx.req.accessToken;
    const userId = token && token.userId;
    let feed = this;

    if (!(feed && feed.id) || !userId) {
      return;
    }

    if (feed.type !== 'listing') {
      throw errValidation('Open house can be created only for listing');
    }

    return await createOpenHouseWithListing(feed, openHouseData, token, userId);
  };

  Feed.destroyListingWithDependencies = async function(ctx, data, destroyFeedById = true) {
    // console.log('[ctx]', ctx);
    const feedId = data.feedId || data.id;

    if (!feedId) return;

    const {
      StatusCheck,
      Appointment
    } = Feed.app.models,
      openHousesToDelete = await Feed.find({
        where: {
          parentId: feedId
        }
      });

    if (openHousesToDelete.length) {
      openHousesToDelete.forEach(async item => {
        await StatusCheck.destroyAll({
          feedId: item.id
        });
        await Appointment.destroyAll({
          feedId: item.id
        });
      });
    }

    await StatusCheck.destroyAll({
      feedId
    });
    await Appointment.destroyAll({
      feedId
    });
    await Feed.destroyAll({
      parentId: feedId
    });
    if (destroyFeedById) await Feed.destroyById(feedId);
    // console.log('[data]', openHousesToDelete);
    return {
      status: true,
      message: 'everything was successfully deleted'
    };
  };

  Feed.remoteMethod(
    'destroyListingWithDependencies', {
      description: 'Destroy listing with all dependencies around the app',
      accepts: [{
        arg: 'ctx',
        type: 'object',
        http: {
          source: 'context'
        }
      },
      {
        arg: 'data',
        type: 'object',
        required: true,
        http: {
          source: 'body'
        }
      }
      ],
      returns: [{
        arg: 'data',
        type: 'Object',
        root: true
      }],
      http: {
        verb: 'delete',
        path: '/destroyListing'
      }
    }
  );

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
    const {
      OpenHouse,
      Attachment,
      AttachmentToOpenHouse
    } = Feed.app.models;
    let openHouse;

    if (!feed.openHouseId) {
      let copiedFeed = await createOpenHouseWithListing(feed, openHouseData, token, userId);
      return copiedFeed.openHouse;
    }

    await OpenHouse.updateAll({
      id: feed.openHouseId
    }, openHouseData);

    if (openHouseData.images && openHouseData.images.length) {
      if (!openHouse) {
        openHouse = await OpenHouse.findById(feed.openHouseId);
      }

      await Promise.map(openHouseData.images, async imageId => {
        imageId = Number(imageId);
        if (!imageId) {
          return false;
        }

        let relationInstance = await Attachment.findById(imageId);
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

        let attachmentToOpenHouse = await AttachmentToOpenHouse.findOne({
          where: attachmentLinkData
        });
        if (!attachmentToOpenHouse) {
          AttachmentToOpenHouse.create({
            attachmentId: imageId,
            openHouseId: openHouse.id
          }, {
            accessToken: token
          });
        }
        return;
      });
    }

    return openHouse || openHouseData;
  };

  const OPEN_HOUSE_ACCEPTS = [{
    arg: 'ctx',
    type: 'object',
    http: {
      source: 'context'
    }
  },
  {
    arg: 'openHouse',
    type: 'object',
    required: true,
    http: {
      source: 'body'
    }
  }
  ];
  const OPEN_HOUSE_RETURNS = {
    arg: 'data',
    type: 'OpenHouse',
    root: true
  };

  // TODO: remove method after app updated
  Feed.remoteMethod(
    'prototype.setOpenHouse', {
      description: 'Create/update open house for listing. (deprecated)',
      accepts: OPEN_HOUSE_ACCEPTS,
      returns: OPEN_HOUSE_RETURNS,
      http: {
        verb: 'post',
        path: '/open-house'
      }
    }
  );

  Feed.remoteMethod(
    'prototype.createOpenHouse', {
      description: 'Create open house from listing.',
      accepts: OPEN_HOUSE_ACCEPTS,
      returns: OPEN_HOUSE_RETURNS,
      http: {
        verb: 'post',
        path: '/create-open-house'
      }
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

  function getBeforeSaveHook(options = {}) {
    return async function beforeSaveHook(ctx, modelInstance) {
      let feed = ctx.args.instance || ctx.args.data;
      if (!feed) return;

      const {
        id
      } = feed,
        typeUpdate = options.type === 'update',
        shouldRemoveDependencies = feed.feedStatus !== 0;

      let currentFeed = null;

      try {
        currentFeed = await Feed.findById(id);
      } catch (e) {
        console.log(e.message);
      }

      if (currentFeed && typeUpdate && shouldRemoveDependencies && (currentFeed.feedStatus !== feed.feedStatus)) {
        await Feed.destroyListingWithDependencies(ctx, currentFeed, false);
      }

      if (typeUpdate && (typeof feed.type !== 'undefined')) throw errValidation('type can not be changed');

      if (feed.options) {
        if (feed.type === 'post') throw errValidation('"options" allowed only for Listings');

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

  async function createOpenHouseWithListing(feed, openHouseData, token, userId) {
    const {
      OpenHouse,
      FeedOptions,
      AttachmentToFeed,
      Attachment,
      AttachmentToOpenHouse,
      GeolocationToFeed
    } = Feed.app.models;

    let listingCopyData = feed.toJSON();
    listingCopyData.type = 'openHouse';
    listingCopyData.parentId = listingCopyData.id;
    delete listingCopyData.id;
    delete listingCopyData.openHouseId;

    const [
      listingFeedOptionsCopyData,
      listingRelatedImagesData,
      listingRelatedGeolocations
    ] = await Promise.all([
      FeedOptions.findById(feed.id),
      AttachmentToFeed.find({
        where: {
          feedId: feed.id
        }
      }),
      GeolocationToFeed.find({
        where: {
          feedId: feed.id
        }
      })
    ]);

    openHouseData.userId = userId;

    let copiedFeed = {};
    let createdFeed;
    let createdFeedOptions;
    let createdOpenHouse;
    let createdAttachmentToFeed = [];
    let createdGeolocationToFeed = [];
    let openHouseImages = [];
    let createdFeedAdditionalImages = [];
    let relatedImagesData = [];
    let relatedGeolocationData = [];

    await Feed.app.dataSources.postgres.transaction(async models => {
      const {
        Feed: tFeed,
        FeedOptions: tFeedOptions,
        OpenHouse: tOpenHouse,
        AttachmentToFeed: tAttachmentToFeed,
        GeolocationToFeed: tGeolocationToFeed
      } = models;

      createdFeed = await tFeed.create(listingCopyData, {
        accessToken: token
      });

      if (listingFeedOptionsCopyData) {
        listingFeedOptionsCopyData.feedId = createdFeed.id;
      }
      openHouseData.feedId = createdFeed.id;
      relatedImagesData = listingRelatedImagesData.map(imageRelation => {
        return {
          feedId: createdFeed.id,
          attachmentId: imageRelation.attachmentId
        };
      });
      relatedGeolocationData = listingRelatedGeolocations.map(locationRelation => {
        return {
          feedId: createdFeed.id,
          geolocationId: locationRelation.geolocationId
        };
      });
      [
        createdFeedOptions,
        createdOpenHouse,
        createdAttachmentToFeed
      ] = await Promise.all([
        listingFeedOptionsCopyData ? tFeedOptions.create(listingFeedOptionsCopyData) : Promise.resolve(null),
        tOpenHouse.create(openHouseData),
        tAttachmentToFeed.create(relatedImagesData, {
          accessToken: token
        }),
        tGeolocationToFeed.create(relatedGeolocationData, {
          accessToken: token
        })
      ]);

      await createdFeed.updateAttributes({
        openHouseId: createdOpenHouse.id
      });
    });

    if (openHouseData.images && openHouseData.images.length) {
      await Promise.map(openHouseData.images, async imageId => {
        imageId = Number(imageId);
        if (!imageId) {
          return false;
        }

        let relationInstance = await Attachment.findById(imageId);
        if (!relationInstance) {
          return false;
        }

        if (!(relationInstance.userId && relationInstance.userId == userId)) {
          return false;
        }
        openHouseImages.push(relationInstance.toJSON());

        let attachmentLinkData = {
          attachmentId: imageId,
          openHouseId: createdOpenHouse.id
        };
        let attachmentToOpenHouse = await AttachmentToOpenHouse.findOne({
          where: attachmentLinkData
        });
        if (!attachmentToOpenHouse) {
          AttachmentToOpenHouse.create({
            attachmentId: imageId,
            openHouseId: createdOpenHouse.id
          }, {
            accessToken: token
          });
        }
        return;
      });
    }

    copiedFeed = createdFeed.toJSON();
    copiedFeed.feedOptions = createdFeedOptions && createdFeedOptions.toJSON();
    copiedFeed.openHouse = createdOpenHouse.toJSON();
    copiedFeed.openHouse.images = openHouseImages;

    let relatedImagesIds = relatedImagesData.map(relation => relation.attachmentId);
    if (relatedImagesIds.length) {
      createdFeedAdditionalImages = await Attachment.find({
        where: {
          id: {
            inq: relatedImagesIds
          }
        }
      });
    }
    if (feed.imageId) {
      copiedFeed.image = await Attachment.findById(feed.imageId);
    }

    copiedFeed.additionalImages = createdFeedAdditionalImages;

    return copiedFeed;
  }

  async function includeCounters(ctx) {
    const token = ctx.req.accessToken;
    const userId = token && token.userId;
    let results = ctx.result;
    let ds = Feed.app.dataSources.postgres;
    let replacements = [];

    if (!(userId && results && results.length)) {
      return;
    }

    let filter = ctx.args && ctx.args.filter || {};

    if (!(filter && filter.where && filter.offset == 0 && filter.where.type == 'listing')) {
      return;
    }

    const query = `SELECT sum(case when "rentType" = 'rent' then 1 else 0 end) as rent,
                   sum(case when "rentType" = 'sale' then 1 else 0 end) as sale,
                   sum(case when "feedStatus" = 0 then 1 else 0 end) as available from "spiti"."feed" AS "Feed"
                  LEFT JOIN "spiti"."feed_options" AS "feedOptions" ON "feedOptions"."feedId" = "Feed"."id"
                  WHERE "Feed"."userId" = $1 AND "Feed"."type" = 'listing' AND "Feed". "deleted_at" Is NULL`;
    replacements.push(userId);
    let counts = await new Promise(
      (resolve, reject) => {
        ds.connector.execute(query, replacements, (err, data) => {
          if (err) {
            console.log(err);
            let error = new Error('Error occured');
            return reject(error);
          }
          return resolve(data[0]);
        });
      });

    results.forEach(feed => feed.counts = counts);
    ctx.result = results;
    return;
  };

  async function includePopulates(ctx) {
    const token = ctx.req.accessToken;
    const userId = token && token.userId;
    let results = ctx.result;

    if (!(userId && results && results.length)) {
      return;
    }

    const FavoriteFeed = Feed.app.models.FavoriteFeed;
    let feedIds = results.map(f => f.id);
    let favorites = await FavoriteFeed.find({
      where: {
        userId,
        feedId: {
          inq: feedIds
        }
      }
    });
    let favoritesIds = favorites.map(f => f.feedId);
    results.forEach(feed => feed.__data.isFavorite = favoritesIds.includes(feed.id));

    ctx.result = results;
    return;
  };

  const  banFeedWithDependencies = async (models, feedId, type, timeBanStart) => {
    const {
      StatusCheck,
      Appointment,
      Feed
    } = models;

    let feed = await Feed.findById(feedId);

    if (!(feed)) {
      throw errFeedNotFound();
    }

    switch (feed.__data.type) {
      case 'listing':
        const  openHousesToDelete = await Feed.find({
          where: {
            parentId: feedId
          }
        });

        if (openHousesToDelete.length) {
          openHousesToDelete.forEach(async item => {
            await StatusCheck.updateAll({
              feedId: item.id
            }, {
              banned_at: timeBanStart,
              deleted_at: timeBanStart,
              updated_at: timeBanStart
            });

            await Appointment.updateAll({
              feedId: item.id
            }, {
              banned_at: timeBanStart,
              deleted_at: timeBanStart,
              updated_at: timeBanStart
            });
          });
        }
        await StatusCheck.updateAll({
          feedId
        }, {
          banned_at: timeBanStart,
          deleted_at: timeBanStart,
          updated_at: timeBanStart
        });

        await Appointment.updateAll({
          feedId
        }, {
          banned_at: timeBanStart,
          deleted_at: timeBanStart,
          updated_at: timeBanStart
        });

        await Feed.updateAll({
          parentId: feedId
        }, {
          banned_at: timeBanStart,
          deleted_at: timeBanStart,
          updated_at: timeBanStart
        });

      default:
        await Feed.updateAll({
          id: feedId
        }, {
          banned_at: timeBanStart,
          deleted_at: timeBanStart,
          updated_at: timeBanStart
        });

    }

    return;
  };

  Feed.banFeed = async function(ctx, feedId) {
    const token = ctx.req.accessToken;
    const userId = token && token.userId;
    if (!userId) {
      throw errAccessDenied();
    }
    if (!feedId) {
      throw errValidation();
    }

    let feed = await Feed.findById(feedId);

    if (!(feed)) {
      throw errFeedNotFound();
    }

    await Feed.app.dataSources.postgres.transaction(async (models) => {
      const timeBanStart = new Date();
      await banFeedWithDependencies(models, feedId, feed.__data.type, timeBanStart);
    });

    return {
      status: true,
      message: 'Feed was successfully banned'
    };
  };

  Feed.remoteMethod(
    'banFeed',
    {
      description: 'ban feed info',
      accepts: [
        {arg: 'ctx', type: 'object', http: { source: 'context' }},
        {arg: 'id', type: 'number', required: true}
      ],
      returns: {
        arg: 'account',
        type: 'object',
        root: true
      },
      http: {verb: 'get', path: '/ban-feed/:id'}
    }
  );

  Feed.sendBanRequest = async function(ctx, id, msg) {
    const token = ctx.req.accessToken;
    const userId = token && token.userId;
   

    if (!userId || !id || !msg) {
      throw errAccessDenied();
    }

    const {
       RoleMapping,
       User,
       Account
     } = Feed.app.models;

    let adminUsers = await RoleMapping.find({
      where: {
        principalType: 'USER',
        roleId: 1
      }
    }).map(item => item.__data.principalId);

    let adminEmails = await User.find({
      where: {
        id: {
          inq: adminUsers
        }
      }
    }).map(item => item.__data.email);

    let account = await Account.findOne({
      where: {
        userId
      }
    });

    let kueJobs = Feed.app.kueJobs;
  
    const feedForBan = await Feed.findOne({
      include: ['account','image','additionalImages'],
      where: { id }
    });
 
    if (!feedForBan) return;
    const  acc = feedForBan.__data.account.__data;
    const  fd = feedForBan.__data;
    const  images = feedForBan.__data.additionalImages;
    const  image = feedForBan.__data.image;

    if (image) {
      images.unshift(image);
    }
 
    const attachments = images.map(item => {
      let  thumbnail = item.__data.sizes.thumbnail;
      if (thumbnail) {
      return {
        filename: thumbnail.fileName,
        path: `/usr/src/storage${thumbnail.publicUrl}`,
        cid: `cid:${thumbnail.fileName}`
        } 
      }  
    });

   
    let opt = {
      user_req_id: account.userId,
      user_req_type: account.type,
      user_req_firstName: account.firstName,
      user_req_lastName: account.lastName,
      user_req_userName: account.userName,
      user_req_brokerage: account.brokerage,
      user_spam_id: acc.userId,
      user_spam_type: acc.type,
      user_spam_firstName: acc.firstName,
      user_spam_lastName: acc.lastName,
      user_spam_userName: acc.userName,
      user_spam_brokerage: acc.brokerage,
      msg: msg,
      feed_id:fd.id,
      feed_type: fd.type,
      feed_title:fd.title,
      feed_feedStatus: fd.feedStatus,
      feed_created_at: fd.created_at,
      cid:'cid:uniq@you'
    
    };

    if ( attachments.length > 0 ) {
      opt.cid = attachments[0].cid;
    }


    let renderer = Feed.app.loopback.template(path.resolve(__dirname, '../views/ban-request.ejs'));

    let options = {
      type: 'email',
      to: adminEmails.shift(),
      from: 'test@domain.com',
      subject: `Ban request: ${msg}`,
      html: renderer(opt),
      user: 'abuser',
      attachments: attachments,
    };
    if (adminEmails.length >= 1) {
       options.cc = adminEmails.join(',');
    }
   
    kueJobs.createJob('sendEmail', options);
    return;
  };

  Feed.remoteMethod(
     'sendBanRequest', {
       description: 'Send ban request',
       accepts: [{
         arg: 'ctx',
         type: 'object',
         http: {
           source: 'context'
         }
       },
       {
         arg: 'id',
         type: 'number',
         required: true
        },
        {
          arg: 'msg',
          type: 'string',
          required: true
        }
       ],
       returns: [{
         arg: 'data',
         type: 'Object',
         root: true
       }],
       http: {
         verb: 'post',
         path: '/send-ban-request'
       }
     }
   );
};
