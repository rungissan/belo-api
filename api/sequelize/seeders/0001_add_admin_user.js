'use strict';

const Promise = require('bluebird');

const path    = require('path');
const server  = require(path.resolve(__dirname, '../../server/server.js'));

const Role        = server.models.Role;
const Client      = server.models.Client;
const RoleMapping = server.models.RoleMapping;

// TODO: change default admin for production
const adminUserData = {
  username: 'John',
  firstname: 'John',
  lastname: 'Doe',
  email: 'john@doe.com',
  password: '94k3HG32NeF58Q94ksyX'
};
const baseUserData = {
  username: 'test',
  firstname: 'Washington',
  lastname: 'Irving',
  email: 'spiti.social.testing@gmail.com',
  password: 'FuZ4vEU3nHVJn'
};

const roleData = [{
  name: 'admin'
}, {
  name: 'prof',
  description: 'Real estate professional'
}, {
  name: 'user',
  description: 'Buyer or renter'
}];

module.exports = {
  up() {
    return Role.create(roleData)
      .then(roles => {
        let adminRole = roles.find(r => r.name == 'admin');

        return Client.create(adminUserData)
          .then(client => {
            adminRole.principals.create({
              principalType: RoleMapping.USER,
              principalId: client.id
            });
          })
          .then(() => {
            return Client.create(baseUserData);
          })
          .then(client => {
            let profRole = roles.find(r => r.name == 'prof');
            profRole.principals.create({
              principalType: RoleMapping.USER,
              principalId: client.id
            });
          });
      });
  },
  down() {
    return true;
  }
};
