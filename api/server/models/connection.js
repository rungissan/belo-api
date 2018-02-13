'use strict';

import Promise from 'bluebird';

import { validateBySchema } from '../lib/validate';
import { errValidation } from '../lib/errors';

module.exports = function(Connection) {
  Connection.createConnection = async function(ctx, connectedId) {
    const token = ctx.req.accessToken;
    const userId = token && token.userId;

    let { connetcionTo, connectionFrom } = await Promise.map({
      connetcionTo: Connection.findOne({where: { userId, connectedId }}),
      connectionFrom: Connection.findOne({where: { userId: connectedId, connectedId: userId }})
    });

    if (connetcionTo) {
      return connetcionTo;
    }

    let connectionToHandler;
    let connectionFromHandler;

    let connectionToData = {
      userId,
      connectedId,
      status: connectionFrom ? 'connected' : 'new'
    };

    return {};
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
};
