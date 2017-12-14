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
});
