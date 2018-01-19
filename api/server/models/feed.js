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
      yearBuilt:         {type: 'number'},
      interiorSqFt:      {type: 'number'},
      acres:             {type: 'number'},
      totalNuberOfUnits: {type: 'number'},
      garage:            {type: 'boolean'},
      garageParking:     {type: 'boolean'},
      driveway:          {type: 'boolean'},
      energyEfficient:   {type: 'boolean'},
      reo:               {type: 'boolean'},
      shortSale:         {type: 'boolean'},
      yearlyOrSeasonal:  {type: 'string', enum: ['Yearly', 'Seasonal']},
      lotSize:           {type: 'string'} // object?
    }
  },

  keyDetails: {
    type: 'object',
    additionalProperties: false,
    properties: {
      laundry:              {type: 'boolean'},
      waterfront:           {type: 'boolean'},
      fireplace:            {type: 'boolean'},
      woodFloors:           {type: 'boolean'},
      centralAir:           {type: 'boolean'},
      outdoorSpace:         {type: 'boolean'},
      skylight:             {type: 'boolean'},
      basement:             {type: 'boolean'},
      finishedBasement:     {type: 'boolean'},
      attic:                {type: 'boolean'},
      yard:                 {type: 'boolean'},
      pool:                 {type: 'boolean'},
      sportsCourt:          {type: 'boolean'},
      elevator:             {type: 'boolean'},
      dogOK:                {type: 'boolean'},
      catOK:                {type: 'boolean'},
      furnished:            {type: 'boolean'},
      inUnitLaundry:        {type: 'boolean'},
      sharedLaundry:        {type: 'boolean'},
      waterview:            {type: 'boolean'},
      pvtOutdoorSpace:      {type: 'boolean'},
      communalOutdoorSpace: {type: 'boolean'},
      conciergeDoorman:     {type: 'boolean'},
      onSiteSuper:          {type: 'boolean'},
      communalOutdoorArea:  {type: 'boolean'},
      fitnessCenter:        {type: 'boolean'},
      storageAvailable:     {type: 'boolean'},
      bikeRoom:             {type: 'boolean'},
      publicWater:          {type: 'boolean'},
      wellWater:            {type: 'boolean'},
      sewer:                {type: 'boolean'},
      electric:             {type: 'boolean'},
      gas:                  {type: 'boolean'},
      cleared:              {type: 'boolean'},
      varianceNeeded:       {type: 'boolean'}
    }
  },

  feesAndCharges: {
    type: 'object',
    additionalProperties: false,
    properties: {
      totalTaxes:     {type: 'number'},
      maintenance:    {type: 'number'},
      commonCharge:   {type: 'number'},
      amenities:      {type: 'number'},
      parking:        {type: 'number'},
      utilities:      {type: 'number'},
      insurance:      {type: 'number'},
      miscExpenses:   {type: 'number'},
      annualRentRoll: {type: 'number'},
      netIncome:      {type: 'number'}
    }
  },

  moveInFees: {
    type: 'object',
    additionalProperties: false,
    properties: {
      firstMonthRent:  {type: 'boolean'},
      lastMonthRent:   {type: 'boolean'},
      securityDeposit: {type: 'number'},
      applicationFee:  {type: 'number'},
      brokerFee:       {type: 'number'}
    }
  },

  utilitiesIncluded: {
    type: 'object',
    additionalProperties: false,
    properties: {
      electric:   {type: 'boolean'},
      water:      {type: 'boolean'},
      cookingGas: {type: 'boolean'},
      heat:       {type: 'boolean'},
      sewer:      {type: 'boolean'},
      garbage:    {type: 'boolean'}
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

    if (!feed.openHouseId) {
      let copiedFeed = await createOpenHouseWithListing(feed, openHouseData, token, userId);
      return copiedFeed.openHouse;
    }

    await OpenHouse.updateAll({id: feed.openHouseId}, openHouseData);

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

  // TODO: remove method after app updated
  Feed.remoteMethod(
    'prototype.setOpenHouse',
    {
      description: 'Create/update open house for listing. (deprecated)',
      accepts: OPEN_HOUSE_ACCEPTS,
      returns: OPEN_HOUSE_RETURNS,
      http: {verb: 'post', path: '/open-house'}
    }
  );

  Feed.remoteMethod(
    'prototype.createOpenHouse',
    {
      description: 'Create open house from listing.',
      accepts: OPEN_HOUSE_ACCEPTS,
      returns: OPEN_HOUSE_RETURNS,
      http: {verb: 'post', path: '/create-open-house'}
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

  async function createOpenHouseWithListing(feed, openHouseData, token, userId) {
    const {
      OpenHouse,
      FeedOptions,
      AttachmentToFeed,
      Attachment,
      AttachmentToOpenHouse
    } = Feed.app.models;

    let listingCopyData = feed.toJSON();
    listingCopyData.type = 'openHouse';
    delete listingCopyData.id;
    delete listingCopyData.openHouseId;

    let [
      listingFeedOptionsCopyData,
      listingRelatedImagesData
    ] = await Promise.all([
      FeedOptions.findById(feed.id),
      AttachmentToFeed.find({where: {feedId: feed.id}})
    ]);

    openHouseData.userId = userId;

    let copiedFeed = {};
    let createdFeed;
    let createdFeedOptions;
    let createdOpenHouse;
    let createdAttachmentToFeed = [];
    let openHouseImages = [];
    let createdFeedAdditionalImages = [];
    let relatedImagesData = [];

    await Feed.app.dataSources.postgres.transaction(async models => {
      const {
        Feed: tFeed,
        FeedOptions: tFeedOptions,
        OpenHouse: tOpenHouse,
        AttachmentToFeed: tAttachmentToFeed
      } = models;

      createdFeed = await tFeed.create(listingCopyData, {accessToken: token});

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

      [
        createdFeedOptions,
        createdOpenHouse,
        createdAttachmentToFeed
      ] = await Promise.all([
        listingFeedOptionsCopyData ? tFeedOptions.create(listingFeedOptionsCopyData) : Promise.resolve(null),
        tOpenHouse.create(openHouseData),
        tAttachmentToFeed.create(relatedImagesData, {accessToken: token})
      ]);

      await createdFeed.updateAttributes({openHouseId: createdOpenHouse.id});
    });

    if (openHouseData.images && openHouseData.images.length) {
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
        openHouseImages.push(relationInstance.toJSON());

        let attachmentLinkData = {
          attachmentId: imageId,
          openHouseId: createdOpenHouse.id
        };

        let attachmentToOpenHouse = await AttachmentToOpenHouse.findOne({where: attachmentLinkData});
        if (!attachmentToOpenHouse) {
          AttachmentToOpenHouse.create({attachmentId: imageId, openHouseId: createdOpenHouse.id}, {accessToken: token});
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
      createdFeedAdditionalImages = await Attachment.find({ where: { id: { inq: relatedImagesIds } } });
    }
    if (feed.imageId) {
      copiedFeed.image = await Attachment.findById(feed.imageId);
    }

    copiedFeed.additionalImages = createdFeedAdditionalImages;

    return copiedFeed;
  }
};
