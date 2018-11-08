'use strict';

import Promise from 'bluebird';

import { validateBySchema } from '../lib/validate';
import { errValidation } from '../lib/errors';
import ConnectionSearch from '../lib/search/connection';

module.exports = function(Connection) {
  Connection.validatesInclusionOf('status', {in: ['new', 'waitingApprove', 'connected', 'rejected']});

  Connection.createConnection = async function(ctx, connectedId) {
    const token = ctx.req.accessToken;
    const userId = token && token.userId;

    let { Account } = Connection.app.models;

    let { connectionTo, connectionFrom, accountTo } = await Promise.props({
      connectionTo: Connection.findOne({where: { userId, connectedId }}),
      connectionFrom: Connection.findOne({where: { userId: connectedId, connectedId: userId }}),
      accountTo: Account.findById(connectedId)
    });

    let connectToIsProf = accountTo && accountTo.type === 'prof';
    if (!connectToIsProf && !connectionFrom) {
      throw errValidation('User can not be connected');
    }

    if (connectionTo  && ['connected', 'rejected'].includes(connectionTo.status)) {
      return connectionTo;
    }

    let updated = {};

    await Connection.app.dataSources.postgres.transaction(async models => {
      const { Connection: TConnection } = models;
      let props = {};
      let connectionToStatus = (connectionTo && connectionTo.status === 'waitingApprove') ? 'connected' : 'new';

      if (!connectionTo) {
        props.createdconnectionTo = TConnection.create(
          {
            userId,
            connectedId,
            status: connectionToStatus
          }
        );
      } else if (connectionTo.status !== connectionToStatus) {
        props.createdconnectionTo = TConnection.updateAll(
          {
            userId,
            connectedId
          },
          { status: connectionToStatus }
        );
      }

      if (!connectionFrom) {
        props.createdConnetcionFrom = TConnection.create(
          {
            userId: connectedId,
            connectedId: userId,
            status: 'waitingApprove'
          }
        );
      } else if (connectionToStatus === 'connected') {
        props.createdConnetcionFrom = TConnection.updateAll(
          {
            userId: connectedId,
            connectedId: userId
          },
          { status: 'connected' }
        );
      }

      updated = await Promise.props(props);
    });

    return updated.createdconnectionTo || connectionTo;
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

    let { connectionTo, connectionFrom } = await Promise.props({
      connectionTo: Connection.findOne({where: { userId, connectedId }}),
      connectionFrom: Connection.findOne({where: { userId: connectedId, connectedId: userId }}),
      accountTo: Account.findById(connectedId)
    });

    if (!connectionFrom) {
      return {ok: false};
    }

    let updated = {};

    await Connection.app.dataSources.postgres.transaction(async models => {
      const { Connection: TConnection } = models;

      let props = {};

      if (connectionTo) {
        props.rejectedconnectionTo = TConnection.updateAll(
          {
            userId,
            connectedId
          },
          { status: 'rejected' }
        );
      } else {
        props.rejectedconnectionTo = TConnection.create({
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

    return updated.rejectedconnectionTo;
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

  Connection.search = async function(ctx, filter = {}) {
    const token = ctx.req.accessToken;
    const userId = token && token.userId;
    const where = filter.where || {};

    const connectionSearch = new ConnectionSearch(
      Connection.app.dataSources.postgres.connector,
      Connection.app,
      {baseModelName: 'Connection'}
    );
    const tableKey = 'Connection';
    const columnName = 'status';
    const query = {
      where: {
        ...where,
        userId,
        account: {
          searchString: where.searchString
        }
      },
      
      include: ['account'],
      limit: filter.limit,
      offset: filter.offset
    };
    where.geolocations && (query.where.geolocations = where.geolocations);

    return await connectionSearch.query(query, { userId });
  };

  Connection.remoteMethod(
    'search',
    {
      description: 'Search by criterion.',
      accepts: [
        {arg: 'ctx',    type: 'object', http: { source: 'context' }},
        {arg: 'filter', type: 'object', required: true}
      ],
      returns: { arg: 'filters', type: 'Array', root: true},
      http: {verb: 'get', path: '/search'}
    }
  );
};
