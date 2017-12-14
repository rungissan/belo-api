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
        principalId: applicationClient.id
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
  const {
    OAuthClientApplication,
    OAuthAccessToken,
    Client,
    Role,
    RoleMapping
  } = app.models;

  let cleanQueries = [
    OAuthClientApplication.destroyAll(),
    OAuthAccessToken.destroyAll(),
    Client.destroyAll(),
    Role.destroyAll(),
    RoleMapping.destroyAll()
  ];

  additionalModels.forEach(modelName => {
    let Model = app.models[modelName];
    cleanQueries.push(Model.destroyAll());
  });

  return await Promise.all(cleanQueries);
}
