'use strict';

import supertest from 'supertest';
import crypto    from 'crypto';
import Promise   from 'bluebird';

export async function createUsers(app, options) {
  let { appClientData, usersData, rolesData } = options;
  const {
    OAuthClientApplication,
    OAuthAccessToken,
    Client,
    Role,
    RoleMapping
  } = app.models;

  let applicationClient = await OAuthClientApplication.create(appClientData);
  let roles = await Role.create(rolesData);

  let users = await Promise.map(usersData, async userData => {
    let user = await Client.create(userData);

    let token = await OAuthAccessToken.create({
      id: crypto.randomBytes(32).toString('hex'),
      userId: user.id,
      appId: applicationClient.id,
      issuedAt: new Date(),
      expiresIn: 3600 * 24,
      scopes: ['DEFAULT']
    });

    if (userData.role) {
      let userRole = roles.find(r => r.name === userData.role);
      await userRole.principals.create({
        principalType: RoleMapping.USER,
        principalId: user.id
      });
    }

    return {
      user,
      role: userData.role,
      token
    };
  });

  return {
    users,
    applicationClient,
    roles
  };
}

export async function clearUsers(app, additionalModels = []) {
  let models = [
    'OAuthClientApplication',
    'OAuthAccessToken',
    'Client',
    'Role',
    'RoleMapping',
    ...additionalModels
  ];

  return clearModels(app, models);
}

export async function clearModels(app, models = []) {
  let cleanQueries = [];

  models.forEach(modelName => {
    let Model = app.models[modelName];
    if (typeof Model.destroyAllForce === 'function') {
      console.log('destroyAllForce.........................')
      cleanQueries.push(Model.destroyAllForce());
    } else {
      cleanQueries.push(Model.destroyAll());
    }
  });

  return await Promise.all(cleanQueries);
}
