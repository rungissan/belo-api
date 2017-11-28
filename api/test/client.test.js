'use strict';

const expect = require('chai').expect;
const supertest = require('supertest');
const api = supertest('http://localhost:3000/api');

const testUser = {
  email: 'test@test.test',
  password: 'testtest'
};

const AUTH_CLIENT = {
  username: 'spiti_web',
  password: 'spiti_seb_pass'
};

describe('Client', function() {
  it('should reject get all clients without auth', () => {
    return api.get('/clients')
      .expect(401);
  });

  it('should reject get a single client without auth', () => {
    return api.get('/clients/findOne')
      .expect(401);
  });

  it('should register client', () => {
    return api.post('/clients')
      .send(testUser)
      .auth(AUTH_CLIENT.username, AUTH_CLIENT.password)
      .expect('Content-Type', /json/)
      .expect(200)
      .then((res) => {
        // console.log('.res......', res)
        // expect(res.statusCode).to.equal(200);

      });
  });
});
