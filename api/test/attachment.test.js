'use strict';

import { expect } from 'chai';
import supertest from 'supertest';
import Promise from 'bluebird';
import { join } from 'path';

import app from '../server/server';
import { createUsers, clearUsers } from './utils';
import {
  TEST_APP_CLIENT,
  TEST_ROLES,
  TEST_USERS
} from './mocks/base-auth';

const api = supertest(app);

describe('Attachment', function() {
  let token;
  let appClient;

  before(() => {
    return createUsers(app, {
      appClientData: TEST_APP_CLIENT,
      usersData: TEST_USERS,
      rolesData: TEST_ROLES
    })
      .then(({ users, applicationClient }) => {
        token = users.find(u => u.role === 'prof').token;
        appClient = applicationClient;
      });
  });

  after(() => clearUsers(app, ['Attachment']));

  it('should reject upload attachment without auth', () => {
    return api.post('/api/attachments/upload')
      .attach('avatar', join(__dirname, './mocks/images/compiling.jpg'))
      .expect(401);
  });

  it('should upload attachment', () => {
    return api.post('/api/attachments/upload')
      .attach('avatar', join(__dirname, './mocks/images/compiling.jpg'))
      .auth(appClient.id, appClient.clientSecret)
      .set('Authorization', 'bearer ' + token.id)
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.be.a('object');
        expect(res.body.id).to.be.a('number');
        expect(res.body.public).to.equal(true);
        expect(res.body.publicUrl).to.be.a('string').to.include('/public/uploads/');
        expect(res.body.userId).to.be.a('number');
      });
  });

  it('should upload private attachment', () => {
    return api.post('/api/attachments/upload')
      .attach('avatar', join(__dirname, './mocks/images/compiling.jpg'))
      .query({ hidden: true })
      .auth(appClient.id, appClient.clientSecret)
      .set('Authorization', 'bearer ' + token.id)
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        expect(res.body).to.be.a('object');
        expect(res.body.id).to.be.a('number');
        expect(res.body.public).to.equal(false);
        expect(res.body.publicUrl).to.equal(null);
        expect(res.body.userId).to.be.a('number');
      });
  });
});
