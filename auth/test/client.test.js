'use strict';

import { expect } from 'chai';
import supertest from 'supertest';
import Promise from 'bluebird';

import app from '../server/server';
import { createBaseClients, clearClients } from './utils';
import {
  TEST_APP_CLIENT,
  TEST_ROLES,
  TEST_USERS
} from './mocks/base-auth';

const api = supertest(app);

describe('Client', function() {
  let appClient;
  let user = TEST_USERS[0];
  const tokenGrantData = {
    grant_type: 'password',
    scope: 'DEFAULT'
  };

  before(() => {
    return createBaseClients(app, {
      appClientData: TEST_APP_CLIENT,
      usersData: TEST_USERS,
      rolesData: TEST_ROLES
    })
      .then(({ users, applicationClient }) => {
        appClient = applicationClient;
      });
  });

  after(() => clearClients(app));

  describe('Resource Owner Password Credentials', function() {
    it('should reject get token auth without Client Creadentials', () => {
      return api.post('/oauth/token')
        .send({
          ...tokenGrantData,
          username: user.email,
          password: user.password
        })
        .expect(401);
    });

    it('should create access token after valid login', () => {
      let data = {
        ...tokenGrantData,
        username: user.email,
        password: user.password
      };

      return api.post('/oauth/token')
        .send(data)
        .auth(appClient.id, appClient.clientSecret)
        .expect(200)
        .then((res) => {
          expect(res.body).to.be.a('object');
          expect(res.body.access_token).to.be.a('string');
          expect(res.body.refresh_token).to.be.a('string');
          expect(res.body.userId).to.be.a('number');
          expect(res.body.token_type).to.equal('Bearer');
          expect(res.body.expires_in).to.be.a('number');
        });
    });

    it('should reject invalid user credentials', () => {
      let data = {
        ...tokenGrantData,
        username: user.email,
        password: 'invalid_password'
      };

      return api.post('/oauth/token')
        .send(data)
        .auth(appClient.id, appClient.clientSecret)
        .expect(403)
        .then((res) => {
          expect(res.body.error).to.equal('invalid_grant');
          expect(res.body.error_description).to.equal('Invalid resource owner credentials');
        });
    });
  });
});
