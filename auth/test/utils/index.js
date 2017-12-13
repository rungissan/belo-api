'use strict';

import supertest from 'supertest';
import crypto    from 'crypto';
import Promise   from 'bluebird';

export async function createBaseClients(app, options) {
  let { appClientData, usersData, rolesData } = options;
  const {
    OAuthClientApplication,
    Client
  } = app.models;

  let applicationClient = await OAuthClientApplication.create(appClientData);
  let users = await Promise.map(usersData, async userData => {
    return await Client.create(userData);
  });

  return {
    users,
    applicationClient
  };
}

export async function clearClients(app, additionalModels = []) {
  const {
    OAuthClientApplication,
    OAuthAccessToken,
    Client
  } = app.models;

  let cleanQueries = [
    OAuthClientApplication.destroyAll(),
    OAuthAccessToken.destroyAll(),
    Client.destroyAll()
  ];

  additionalModels.forEach(modelName => {
    let Model = app.models[modelName];
    cleanQueries.push(Model.destroyAll());
  });

  return await Promise.all(cleanQueries);
}
