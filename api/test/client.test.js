'use strict';

import { expect } from 'chai';
import supertest from 'supertest';
import Promise from 'bluebird';

import app from '../server/server';
import { createUsers, clearUsers } from './utils';
import {
  TEST_APP_CLIENT,
  TEST_ROLES,
  TEST_USERS
} from './mocks/base-auth';

const api = supertest(app);

describe('Client', function() {
  let appClient;
  let token;
  let user;

  before(() => {
    return createUsers(app, {
      appClientData: TEST_APP_CLIENT,
      usersData: [{
        email: 'test@test.test',
        password: 'testtest'
      }],
      rolesData: TEST_ROLES
    })
      .then(({ users, applicationClient }) => {
        appClient = applicationClient;
        user = users[0].user;
        token = users[0].token;
      });
  });

  after(() => clearUsers(app));

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
      .send({
        email: 'test@test.test',
        password: 'testtest'
      })
      .auth(appClient.id, appClient.clientSecret)
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
      .auth(appClient.id, appClient.clientSecret)
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.be.a('object');
        expect(res.body.email).to.equal('test_unique@test.test');
        expect(res.body.id).to.be.a('number');
      });
  });

  it('should set client role', () => {
    return api.post(`/api/clients/${user.id}/role`)
      .send({role: 'prof'})
      .auth(appClient.id, appClient.clientSecret)
      .set('Authorization', 'bearer ' + token.id)
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.be.a('object');
        expect(res.body.email).to.equal('test@test.test');
        expect(res.body.id).to.be.a('number');
      });
  });

  it('should validate email case insensetive wher register', () => {
    const testClientUnique = {
      email: 'uniqueclient@test.test',
      password: 'testtest'
    };

    const Client = app.models.Client;

    return Client.create(testClientUnique)
      .then(() => {
        return api.post('/api/clients')
          .send({
            email: 'uniqueClient@test.test',
            password: 'testtest'
          })
          .auth(appClient.id, appClient.clientSecret)
          .expect('Content-Type', /json/)
          .expect(422)
          .then((res) => {
            expect(res.body.error).to.be.a('object');
            expect(res.body.error.message).to.be.a('string').to.include('Email already exists');
          });
      });
  });
});
