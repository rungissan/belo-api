'use strict';

import Promise from 'bluebird';

import { validateBySchema } from '../lib/validate';

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

module.exports = function(Listing) {
  Listing.validatesInclusionOf('rent_type', {in: ['rent', 'sale']});

  Listing.observe('before save', (ctx, next) => {
    let instance = ctx.instance || ctx.data;

    Promise.map(Object.keys(FEATURES_VALIDATIONS), key => {
      if (instance[key]) {
        return validateBySchema(instance[key], FEATURES_VALIDATIONS[key], 'Listing');
      }
      return true;
    })
      .then(() => next())
      .catch(next);
  });
};
