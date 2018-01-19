'use strict';

import { expect } from 'chai';
import supertest from 'supertest';
import Promise from 'bluebird';

import app from '../server/server';
import { createUsers, clearUsers, clearModels } from './utils';
import { apiWithAuth } from './utils/api';
import {
  TEST_APP_CLIENT,
  TEST_ROLES,
  TEST_USERS
} from './mocks/base-auth';

const api = supertest(app);

describe('Feed', function() {
  const { Feed } = app.models;

  let tokenProf;
  let tokenUser;
  let user;
  let prof;
  let appClient;
  let apiCall;

  before(() => {
    return createUsers(app, {
      appClientData: TEST_APP_CLIENT,
      usersData: TEST_USERS,
      rolesData: TEST_ROLES
    })
      .then(({ users, applicationClient }) => {
        ({ user: prof, token: tokenProf} = users.find(u => u.role === 'prof'));
        ({ user: user, token: tokenUser} = users.find(u => u.role === 'user'));

        appClient = applicationClient;
        apiCall = apiWithAuth(api, applicationClient);
      });
  });

  // after(() => clearUsers(app, ['Feed']));

  describe('ACL', function() {
    before(() => {
    });
    after(() => {});

    it('should reject get all feeds without auth', () => {
      return api.get('/api/feeds')
        .expect(401);
    });

    it('should allow "prof" to get all feeds', () => {
      return apiCall('/api/feeds', tokenProf)
        .expect(200)
        .then((res) => {
          expect(res.body).to.be.a('array');
        });
    });

    it('should allow "user" to get all feeds', () => {
      return apiCall('/api/feeds', tokenUser)
        .expect(200)
        .then((res) => {
          expect(res.body).to.be.a('array');
        });
    });
  });

  describe('Post', function() {
    const testPost = {
      type: 'post',
      title: 'test post',
      description: 'test description'
    };

    after(() => clearModels(app, ['Feed']));

    it('should deny post creation for "user"', () => {
      return apiCall('post', '/api/feeds', tokenUser)
        .send(testPost)
        .expect(403)
        .then((res) => {
          expect(res.body.error).to.be.a('object');
          expect(res.body.error.code).to.equal('ACCESS_DENIED');
        });
    });

    it('should allow post creation for "prof"', () => {
      return apiCall('post', '/api/feeds', tokenProf)
        .send(testPost)
        .expect(200)
        .then((res) => {
          expect(res.body).to.be.a('object');
          expect(res.body.type).to.equal('post');
        });
    });

    it('should not allow post creation with options', () => {
      let invalidPost = {...testPost, options: {rentType: 'sale'}};
      return apiCall('post', '/api/feeds', tokenProf)
        .send(invalidPost)
        .expect(422)
        .then((res) => {
          expect(res.body.error).to.be.a('object');
          expect(res.body.error.message).to.equal('"options" allowed only for Listings');
        });
    });

    it('created post should have properties', () => {
      return apiCall('post', '/api/feeds', tokenProf)
        .send(testPost)
        .expect(200)
        .then((res) => {
          expect(res.body).to.be.a('object');
          expect(res.body.id).to.be.a('number');
          expect(res.body.type).to.equal('post');
          expect(res.body.title).to.equal('test post');
          expect(res.body.description).to.equal('test description');
        });
    });

    it('should allow to edit post for owner', () => {
      return Feed.create({...testPost, userId: prof.id})
        .then(post => {
          return apiCall('patch', `/api/feeds/${post.id}`, tokenProf)
            .send({title: 'updated title'})
            .expect(200)
            .then((res) => {
              expect(res.body).to.be.a('object');
              expect(res.body.title).to.equal('updated title');
            });
        });
    });

    it('should not allow to edit feed type', () => {
      return Feed.create({...testPost, userId: prof.id})
        .then(post => {
          return apiCall('patch', `/api/feeds/${post.id}`, tokenProf)
            .send({type: 'listing'})
            .expect(422)
            .then((res) => {
              expect(res.body.error).to.be.a('object');
              expect(res.body.error.message).to.equal('type can not be changed');
            });
        });
    });

    it('should disallow to edit post for not owner', () => {
      return Feed.create({...testPost, userId: user.id})
        .then(post => {
          return apiCall('patch', `/api/feeds/${post.id}`, tokenProf)
            .send({title: 'updated title'})
            .expect(403);
        });
    });

    it('should allow to delete post for owner', () => {
      return Feed.create({...testPost, userId: prof.id})
        .then(post => {
          return apiCall('delete', `/api/feeds/${post.id}`, tokenProf)
            .expect(200);
        });
    });

    it('should deny to delete post for not owner', () => {
      return Feed.create({...testPost, userId: user.id})
        .then(post => {
          return apiCall('delete', `/api/feeds/${post.id}`, tokenProf)
            .expect(403);
        });
    });
  });

  describe('Listing', function() {
    const testListing = {
      type: 'listing',
      title: 'test listing',
      description: 'test description',
      options: {
        rentType: 'sale',
        propertyType: 'singleFamily',
        bedrooms: 1,
        bathrooms: 1,
        price: 20,
        square: 2,
        propertyFeatures: {
          laundry: true,
          dogs: true
        }
      }
    };

    const testListingWithOptions = {
      type: 'listing',
      title: 'test listing',
      description: 'test description',
      options: {
        rentType: 'sale',
        propertyType: 'singleFamily',
        bedrooms: 1,
        bathrooms: 1,
        price: 20,
        square: 2,
        propertyFeatures: {
          style: 'Bungalow',
          yearBuilt: 42,
          shortSale: true
        },
        keyDetails: {
          laundry: true
        },
        feesAndCharges: {
          totalTaxes: 322
        },
        moveInFees: {
          applicationFee: 322,
          firstMonthRent: true
        },
        utilitiesIncluded: {
          electric: true
        },
        schoolInformation: {
          custom: [{
            name: 'Test school',
            value: 'test'
          }]
        }
      }
    };

    after(() => clearModels(app, ['Feed']));

    it('should deny listing creation for "user"', () => {
      return apiCall('post', '/api/feeds', tokenUser)
        .send(testListing)
        .expect(403)
        .then((res) => {
          expect(res.body.error).to.be.a('object');
          expect(res.body.error.code).to.equal('ACCESS_DENIED');
        });
    });

    it('should allow listing creation for "prof"', () => {
      return apiCall('post', '/api/feeds', tokenProf)
        .send(testListing)
        .expect(200)
        .then((res) => {
          expect(res.body).to.be.a('object');
          expect(res.body.type).to.equal('listing');
        });
    });

    it('should require listing price', () => {
      let invalidListing = {...testListing};
      invalidListing.options = {
        propertyFeatures: {
          laundry: true,
          dogs: true
        }
      };

      return apiCall('post', '/api/feeds', tokenProf)
        .send(invalidListing)
        .expect(422)
        .then((res) => {
          expect(res.body.error).to.be.a('object');
          expect(res.body.error.code).to.equal('VALIDATION_ERROR');
          expect(res.body.error.details).to.be.a('object');
          expect(res.body.error.details.codes).to.be.a('object');

          ['rentType', 'bedrooms', 'bathrooms', 'price', 'square', 'propertyType'].forEach(key => {
            expect(res.body.error.details.codes[key]).to.be.a('array').to.include('required');
          });
        });
    });

    it('created listing should have properties', () => {
      return apiCall('post', '/api/feeds', tokenProf)
        .send(testListing)
        .expect(200)
        .then((res) => {
          expect(res.body).to.be.a('object');
          expect(res.body.id).to.be.a('number');
          expect(res.body.type).to.equal('listing');
          expect(res.body.title).to.equal('test listing');
          expect(res.body.description).to.equal('test description');
        });
    });

    it('created listing should have feedOptions propertyFeatures', () => {
      return apiCall('post', '/api/feeds', tokenProf)
        .send(testListingWithOptions)
        .expect(200)
        .then((res) => {
          expect(res.body.options).to.be.a('object');
          expect(res.body.options.propertyFeatures).to.be.a('object');
          expect(res.body.options.propertyFeatures.style).to.equal('Bungalow');
          expect(res.body.options.propertyFeatures.yearBuilt).to.equal(42);
        });
    });

    it('created listing should have feedOptions keyDetails', () => {
      return apiCall('post', '/api/feeds', tokenProf)
        .send(testListingWithOptions)
        .expect(200)
        .then((res) => {
          expect(res.body.options).to.be.a('object');
          expect(res.body.options.keyDetails).to.be.a('object');
          expect(res.body.options.keyDetails.laundry).to.equal(true);
        });
    });

    it('created listing should have feedOptions feesAndCharges', () => {
      return apiCall('post', '/api/feeds', tokenProf)
        .send(testListingWithOptions)
        .expect(200)
        .then((res) => {
          expect(res.body.options).to.be.a('object');
          expect(res.body.options.feesAndCharges).to.be.a('object');
          expect(res.body.options.feesAndCharges.totalTaxes).to.equal(322);
        });
    });

    it('created listing should have feedOptions moveInFees', () => {
      return apiCall('post', '/api/feeds', tokenProf)
        .send(testListingWithOptions)
        .expect(200)
        .then((res) => {
          expect(res.body.options).to.be.a('object');
          expect(res.body.options.moveInFees).to.be.a('object');
          expect(res.body.options.moveInFees.applicationFee).to.equal(322);
          expect(res.body.options.moveInFees.firstMonthRent).to.equal(true);
        });
    });

    it('created listing should have feedOptions utilitiesIncluded', () => {
      return apiCall('post', '/api/feeds', tokenProf)
        .send(testListingWithOptions)
        .expect(200)
        .then((res) => {
          expect(res.body.options).to.be.a('object');
          expect(res.body.options.utilitiesIncluded).to.be.a('object');
          expect(res.body.options.utilitiesIncluded.electric).to.equal(true);
        });
    });

    it('created listing should have feedOptions schoolInformation', () => {
      return apiCall('post', '/api/feeds', tokenProf)
        .send(testListingWithOptions)
        .expect(200)
        .then((res) => {
          expect(res.body.options).to.be.a('object');
          expect(res.body.options.schoolInformation).to.be.a('object');
          expect(res.body.options.schoolInformation.custom).to.be.a('array');
          expect(res.body.options.schoolInformation.custom).to.deep.equal([{
            name: 'Test school',
            value: 'test'
          }]);
        });
    });

    it('should allow to edit post for owner', () => {
      return Feed.create({...testListing, userId: prof.id})
        .then(post => {
          return apiCall('patch', `/api/feeds/${post.id}`, tokenProf)
            .send({title: 'updated title'})
            .expect(200)
            .then((res) => {
              expect(res.body).to.be.a('object');
              expect(res.body.title).to.equal('updated title');
            });
        });
    });

    it('should disallow to edit post for not owner', () => {
      return Feed.create({...testListing, userId: user.id})
        .then(listing => {
          return apiCall('patch', `/api/feeds/${listing.id}`, tokenProf)
            .send({title: 'updated title'})
            .expect(403);
        });
    });

    it('should allow to delete post for owner', () => {
      return Feed.create({...testListing, userId: prof.id})
        .then(listing => {
          return apiCall('delete', `/api/feeds/${listing.id}`, tokenProf)
            .expect(200);
        });
    });

    it('should deny to delete post for not owner', () => {
      return Feed.create({...testListing, userId: user.id})
        .then(listing => {
          return apiCall('delete', `/api/feeds/${listing.id}`, tokenProf)
            .expect(403);
        });
    });
  });

  describe('OpenHouse', function() {
    const testListing = {
      type: 'listing',
      title: 'test listing',
      description: 'test description',
      options: {
        rentType: 'sale',
        bedrooms: 1,
        bathrooms: 1,
        price: 20,
        square: 2,
        propertyFeatures: {
          laundry: true,
          dogs: true
        }
      }
    };
    let testOpenHouse = {
      host: 'test',
      contactPhone: 1234,
      date: new Date(),
      timeStart: new Date(),
      timeEnd: new Date()
    };

    after(() => clearModels(app, ['Feed']));

    it('should allow to link OpenHouse to Listing', () => {
      return Feed.create({...testListing, userId: prof.id})
        .then(post => {
          return apiCall('post', `/api/feeds/${post.id}/open-house`, tokenProf)
            .send(testOpenHouse)
            .expect(200)
            .then((res) => {
              expect(res.body).to.be.a('object');
              expect(res.body.id).to.be.a('number');
            });
        });
    });

    it('should allow to delete OpenHouse', () => {
      return Feed.create({...testListing, userId: prof.id})
        .then(post => {
          return apiCall('delete', `/api/feeds/${post.id}/open-house`, tokenProf)
            .send(testOpenHouse)
            .expect(200)
            .then((res) => {
              expect(res.body).to.be.a('object');
              expect(res.body.ok).to.equal(true);
            });
        });
    });

    it('should deny to delete OpenHouse for not owner', () => {
      return Feed.create({...testListing, userId: user.id})
        .then(post => {
          return apiCall('delete', `/api/feeds/${post.id}/open-house`, tokenProf)
            .send(testOpenHouse)
            .expect(403);
        });
    });

    it('should allow to update OpenHouse', () => {
      let postId;
      let updatedDate;
      return Feed.create({...testListing, userId: prof.id})
        .then(post => {
          postId = post.id;
          return apiCall('post', `/api/feeds/${postId}/open-house`, tokenProf).send(testOpenHouse);
        })
        .then((res) => {
          expect(res.body.contactPhone).to.equal('1234');
          updatedDate = new Date();
          return apiCall('post', `/api/feeds/${postId}/open-house`, tokenProf)
            .send({
              date: updatedDate,
              contactPhone: 11111
            });
        })
        .then((res) => {
          expect(res.body.contactPhone).to.equal('11111');
          expect(res.body.date).to.equal(updatedDate.toISOString());
        });
    });

    it('should deny to link OpenHouse to Post', () => {
      return Feed.create({...testListing, userId: prof.id, type: 'post'})
        .then(post => {
          return apiCall('post', `/api/feeds/${post.id}/open-house`, tokenProf)
            .send(testOpenHouse)
            .expect(422)
            .then((res) => {
              expect(res.body.error).to.be.a('object');
              expect(res.body.error.message).to.equal('Open house can be created only for listing');
            });
        });
    });

    it('should deny to link OpenHouse if user not own Listing', () => {
      return Feed.create({...testListing, userId: user.id})
        .then(post => {
          return apiCall('post', `/api/feeds/${post.id}/open-house`, tokenProf)
            .send(testOpenHouse)
            .expect(403)
            .then((res) => {
              expect(res.body.error).to.be.a('object');
              expect(res.body.error.code).to.equal('ACCESS_DENIED');
            });
        });
    });

    it('should require date when linking OpenHouse', () => {
      let data = {...testOpenHouse};
      delete data.date;

      return Feed.create({...testListing, userId: prof.id})
        .then(post => {
          return apiCall('post', `/api/feeds/${post.id}/open-house`, tokenProf)
            .send(data)
            .expect(422)
            .then((res) => {
              expect(res.body.error).to.be.a('object');
              expect(res.body.error.code).to.equal('VALIDATION_ERROR');
              expect(res.body.error.details.codes.date).to.be.a('array').to.include('required');
            });
        });
    });
  });
});
