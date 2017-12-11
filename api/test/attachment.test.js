'use strict';

import { expect } from 'chai';
import supertest from 'supertest';
import Promise from 'bluebird';
import { join } from 'path';

import app from '../server/server';
import {
  TEST_APP_CLIENTS,
  TEST_ROLES,
  TEST_USER
} from './mocks/base-auth';
const api = supertest(app);

describe('Attachment', function() {
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
    const Attachment = app.models.Attachment;

    let cleanQueries = [
      OAuthClientApplication.destroyAll(),
      Client.destroyAll(),
      OAuthAccessToken.destroyAll(),
      Role.destroyAll(),
      Attachment.destroyAll()
    ];

    return Promise.all(cleanQueries);
  });

  it('should reject upload attachment without auth', () => {
    return api.post('/api/attachments/upload')
      .attach('avatar', join(__dirname, './mocks/images/compiling.jpg'))
      .expect(401);
  });

  it('should upload attachment', () => {
    return api.post('/api/attachments/upload')
      .attach('avatar', join(__dirname, './mocks/images/compiling.jpg'))
      .auth(TEST_APP_CLIENTS[0].id, TEST_APP_CLIENTS[0].clientSecret)
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
      .auth(TEST_APP_CLIENTS[0].id, TEST_APP_CLIENTS[0].clientSecret)
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
