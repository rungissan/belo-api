'use strict';
const debug = require('debug')('spiti:boot:socket');

import io       from 'socket.io';
import ioAuth   from 'socketio-auth';
import redis    from 'redis';
import sioRedis from 'socket.io-redis';
import Promise  from 'bluebird';

import config from '../config/index';
import validate from '../lib/validate';
import {
  stringifyJson,
  parseJson
} from './util';
// loopback-connector-kv-redis not support key delete and looks like not production ready.
// so use redis client lib.
const redisCliSocket = redis.createClient(config.redisSocketKeys);
Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

const USERID_PREFIX = 'user_';

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
    eventName,
    validationSchema: options.validationSchema,
    modelName: options.modelName || Model.definition.name
  };

  debug('added socket handler ', eventName);
  app.ioHandlers.push(handlerOptions);
}

export default function setupIoHandlers(app, checkAccessToken) {
  app.io = io(app.server);
  app.io.adapter(sioRedis(config.redisSioAdapter));

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
      return getRedisJsonAsync(USERID_PREFIX + user.id, [])
        .then(socketIds => removeOldSocketKeys(app.io, socketIds))
        .then(socketIds => {
          socketIds.push(socket.id);
          return setRedisJsonAsync(USERID_PREFIX + user.id, socketIds, []);
        });
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
        return getRedisJsonAsync(USERID_PREFIX + socket.user.id, [])
          .then(socketIds => {
            socketIds = socketIds.filter(s => s != socket.id);
            return setRedisJsonAsync(USERID_PREFIX + socket.user.id, socketIds, []);
          });
      }
    });

    socket.on('event', async function(eventName, data, cb) {
      if (!cb && typeof data === 'function') {
        cb = data;
        data = {};
      }

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

        if (eventHandler.validationSchema) {
          await validate(data, eventHandler.modelName, eventHandler.validationSchema);
        }

        let response = await eventHandler.handler(socket, data);
        (typeof cb === 'function') && cb(null, response);
      } catch (err) {
        debug('socket handler error: ', err);
        let error = {
          statusCode: err.statusCode,
          type: err.type,
          message: err.message,
          code: err.code,
          status: err.status,
          details: err.details
        };
        (typeof cb === 'function') && cb(error);
      }
    });
  });
};

function getRedisJsonAsync(key, defaultValue) {
  return redisCliSocket.getAsync(key)
    .then(data => {
      let parsedData = defaultValue;
      if (data) {
        parsedData = parseJson(data, defaultValue);
      }
      return parsedData;
    });
}

function setRedisJsonAsync(key, value, defaultValue) {
  return redisCliSocket.setAsync(key, stringifyJson(value, defaultValue));
}

function removeOldSocketKeys(io, socketIds) {
  return new Promise((resolve, reject) => {
    if (!(socketIds && socketIds.length)) {
      return resolve(socketIds);
    }

    io.of('/').adapter.clients((err, clients) => {
      if (err) {
        return reject(err);
      }
      return resolve(socketIds.filter(socketId => clients.includes(socketId)));
    });
  });
}

export function joinRoomByUserId(app, userId = 0, roomName) {
  return getRedisJsonAsync(USERID_PREFIX + userId, [])
    .then(socketIds => {
      socketIds.forEach(socketId => joinRemoteRoom(app.io, socketId, roomName));
      return socketIds;
    });
}

function joinRemoteRoom(io, socketId, roomName) {
  return new Promise((resolve) => {
    io.of('/').adapter.remoteJoin(socketId, roomName, (err, data) => {
      if (err) {
        resolve(null);
      }
      resolve(socketId);
    });
  });
}

export function sendToSocketByUserId(app, userId = 0, eventName, payload) {
  return getRedisJsonAsync(USERID_PREFIX + userId, [])
    .then(recipientSocketIds => {
      debug(`send message to user: ${userId}, socket: ${recipientSocketIds}`, payload);
      recipientSocketIds.forEach(recipientSocketId => {
        app.io.to(recipientSocketIds).emit(eventName, payload);
      });
    });
}
