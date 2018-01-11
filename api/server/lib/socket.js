'use strict';

import io     from 'socket.io';
import ioAuth from 'socketio-auth';

const debug = require('debug')('spiti:boot:socket');

export function addSocketHandler(Model, handler, options) {
  let app = Model.app;
  app.ioHandlers = app.ioHandlers || [];

  if (typeof handler !== 'function') {
    throw new Error('handler should be a function');
  }

  let eventName = options.eventName || handler.name;
  if (!eventName || eventName === 'anonymous') {
    throw new Error('eventName required');
  }

  eventName = `${Model.definition.name.toLowerCase()}:${eventName}`;

  let handlerOptions = {
    handler,
    eventName
  };

  debug('added socket handler ', eventName);
  app.ioHandlers.push(handlerOptions);
}

export default function setupIoHandlers(app, checkAccessToken) {
  app.io = io(app.server);

  const { Client, OAuthAccessToken, SocketKey } = app.models;
  async function getUserData(socket, token) {
    let accessToken = await OAuthAccessToken.findById(token);

    if (!accessToken) {
      return null;
    }
    let user = await Client.findById(accessToken.userId);

    if (user) {
      socket.user = user;

      debug(`socket: set user id: ${user.id}, socket id: ${socket.id}`);
      // SocketKey.set(`${user.id}`, socket.id);
    } else {
      socket.user = null;
    }

    return user;
  }

  ioAuth(app.io, {
    authenticate: function(socket, data, callback) {
      checkAccessToken({}, data.token, (err, token) => {
        if (err) {
          debug('socket: auth error', err);
          callback(err);
        } else {
          debug('socket: auth success', token);
          callback(null, token);
        }
      });
    },
    postAuthenticate: function(socket, data) {
      socket.token = data.token;
      getUserData(socket, data.token); // socketio-auth not pass callback to authenticate function, can not use populated data
    }
  });

  app.io.on('connection', function(socket) {
    debug('socket: user connected');
    socket.on('disconnect', function() {
      debug('socket: user disconnected');

      if (socket.user && socket.user.id) {
        debug(`socket: delete user id: ${socket.user.id}, socket id: ${socket.id}`);
        // SocketKey.delete(`${socket.user.id}`);
      }
    });

    socket.on('event', async function(eventName, data, cb) {
      if (!socket.auth) {
        let err = new Error('unauthorized');
        err.code = 'unauthorized';
        return (typeof cb === 'function') && cb(err);
      }

      if (!(eventName && typeof eventName === 'string')) {
        return;
      }

      const eventHandler = app.ioHandlers.find(handler => handler.eventName === eventName);

      if (!eventHandler) {
        return;
      }
      debug('socket: handle event ', eventName);

      try {
        if (!socket.user) {
          await getUserData(socket, socket.token);
        }

        let response = await eventHandler.handler(socket, data);
        (typeof cb === 'function') && cb(null, response);
      } catch (err) {
        debug('socket handler error: ', err);
        let error = {
          message: err.message,
          code: err.code,
          status: err.status
        };
        (typeof cb === 'function') && cb(error);
      }
    });
  });
};
