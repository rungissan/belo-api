'use strict';

import { expect } from 'chai';
import supertest from 'supertest';
import Promise from 'bluebird';

import app from '../server/server';
import {
  TEST_APP_CLIENTS,
  TEST_ROLES,
  TEST_USER
} from './mocks/base-auth';
const api = supertest(app);

describe('Client', function() {
  let userId;
  let appClientId;
  let token;

  before(() => {
    const OAuthClientApplication = app.models.OAuthClientApplication;
    const Client = app.models.Client;
    const OAuthAccessToken = app.models.OAuthAccessToken;
    const Role = app.models.Role;

    return OAuthClientApplication.create(TEST_APP_CLIENTS)
      .then(appClients => {
        appClientId = appClients[0].id;
        return Client.create(TEST_USER);
      })
      .then(user => {
        userId = user.id;
        return OAuthAccessToken.create({
          id: 'qwerty',
          userId: userId,
          appId: appClientId,
          issuedAt: new Date(),
          expiresIn: 3600 * 24,
          scopes: ['DEFAULT']
        });
      })
      .then(accessToken => {
        token = accessToken;
      })
      .then(() => {
        return Role.create(TEST_ROLES);
      });
  });

  after(() => {
    const OAuthClientApplication = app.models.OAuthClientApplication;
    const Client = app.models.Client;
    const OAuthAccessToken = app.models.OAuthAccessToken;
    const Role = app.models.Role;

    let cleanQueries = [
      OAuthClientApplication.destroyAll(),
      Client.destroyAll(),
      OAuthAccessToken.destroyAll(),
      Role.destroyAll()
    ];

    return Promise.all(cleanQueries);
  });

  it('should reject get all clients without auth', () => {
    return api.get('/api/clients')
      .expect(401);
  });

  it('should reject get a single client without auth', () => {
    return api.get('/api/clients/findOne')
      .expect(401);
  });

  it('should not register client with existent email', () => {
    return api.post('/api/clients')
      .send(TEST_USER)
      .auth(TEST_APP_CLIENTS[0].id, TEST_APP_CLIENTS[0].clientSecret)
      .expect('Content-Type', /json/)
      .expect(422)
      .then((res) => {
        expect(res.body.error).to.be.a('object');
        expect(res.body.error.message).to.equal('The `Client` instance is not valid. Details: `email` Email already exists (value: "test@test.test").');
      });
  });

  it('should register client', () => {
    return api.post('/api/clients')
      .send({
        email: 'test_unique@test.test',
        password: 'testtest'
      })
      .auth(TEST_APP_CLIENTS[0].id, TEST_APP_CLIENTS[0].clientSecret)
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.be.a('object');
        expect(res.body.email).to.equal('test_unique@test.test');
        expect(res.body.id).to.be.a('number');
      });
  });

  it('should set client role', () => {
    return api.post(`/api/clients/${userId}/role`)
      .send({role: 'prof'})
      .auth(TEST_APP_CLIENTS[0].id, TEST_APP_CLIENTS[0].clientSecret)
      .set('Authorization', 'bearer ' + token.id)
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.be.a('object');
        expect(res.body.email).to.equal(TEST_USER.email);
        expect(res.body.id).to.be.a('number');
      });
  });
});
