'use strict';

import Promise from 'bluebird';

import { validateBySchema } from '../lib/validate';
import { errValidation } from '../lib/errors';

module.exports = function(Connection) {
  Connection.createConnection = async function(ctx, connectedId) {
    const token = ctx.req.accessToken;
    const userId = token && token.userId;

    let { Account } = Connection.app.models;

    let { connetcionTo, connectionFrom, accountTo } = await Promise.props({
      connetcionTo: Connection.findOne({where: { userId, connectedId }}),
      connectionFrom: Connection.findOne({where: { userId: connectedId, connectedId: userId }}),
      accountTo: Account.findById(connectedId)
    });

    if (!(accountTo && accountTo.type === 'prof')) {
      throw errValidation('User can not be connected');
    }

    if (connetcionTo) {
      return connetcionTo;
    }

    let updated = {};

    let connectionToData = {
      userId,
      connectedId,
      status: connectionFrom ? 'connected' : 'new'
    };

    await Connection.app.dataSources.postgres.transaction(async models => {
      const { Connection: TConnection } = models;

      let props = {
        createdConnetcionTo: TConnection.create(connectionToData)
      };

      if (connectionFrom) {
        props.connectionFromUpdated = TConnection.updateAll(
          {
            userId: connectedId,
            connectedId: userId
          },
          { status: 'connected' });
      }

      updated = await Promise.props(props);
    });

    return updated.createdConnetcionTo;
  };

  Connection.remoteMethod(
    'createConnection',
    {
      description: 'Create connection with another account',
      accepts: [
        { arg: 'ctx',         type: 'object', http: { source: 'context' } },
        { arg: 'connectedId', type: 'number' }
      ],
      returns: { arg: 'data', type: 'Connection', root: true},
      http:  {verb: 'post', path: '/create-connection' }
    }
  );

  Connection.rejectConnection = async function(ctx, connectedId) {
    const token = ctx.req.accessToken;
    const userId = token && token.userId;

    let { Account } = Connection.app.models;

    let { connetcionTo, connectionFrom } = await Promise.props({
      connetcionTo: Connection.findOne({where: { userId, connectedId }}),
      connectionFrom: Connection.findOne({where: { userId: connectedId, connectedId: userId }}),
      accountTo: Account.findById(connectedId)
    });

    if (!connectionFrom) {
      return {ok: false};
    }

    let updated = {};

    let connectionToData = {
      userId,
      connectedId,
      status: 'rejected'
    };

    await Connection.app.dataSources.postgres.transaction(async models => {
      const { Connection: TConnection } = models;

      let props = {};

      if (connetcionTo) {
        props.rejectedConnetcionTo = TConnection.updateAll(
          {
            userId,
            connectedId
          },
          { status: 'rejected' }
        );
      } else {
        props.rejectedConnetcionTo = TConnection.create({
          userId,
          connectedId,
          status: 'rejected'
        });
      }

      props.rejectedConnetcionFrom = TConnection.updateAll(
        {
          userId: connectedId,
          connectedId: userId
        },
        { status: 'rejected' }
      );

      updated = await Promise.props(props);
    });

    return updated.rejectedConnetcionTo;
  };

  Connection.remoteMethod(
    'rejectConnection',
    {
      description: 'Create connection with another account',
      accepts: [
        { arg: 'ctx',         type: 'object', http: { source: 'context' } },
        { arg: 'connectedId', type: 'number' }
      ],
      returns: { arg: 'data', type: 'Connection', root: true},
      http:  {verb: 'post', path: '/reject-connection' }
    }
  );
};
