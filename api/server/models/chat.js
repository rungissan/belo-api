'use strict';

import Promise from 'bluebird';

import { addSocketHandler } from '../lib/socket';

module.exports = function(Chat) {
  async function createChat(socket, data) {
    return Promise.resolve('resssss');
  };

  async function getChat(socket, data = {}) {
    let { filter = {} } = data;
    let { user } = socket;

    const { ChatToAccount } = Chat.app.models;

    let chats = await ChatToAccount.find({
      where: { userId: user.id },
      include: {
        relation: 'chat',
        scope: {
          include: {
            relation: 'image'
          }
        }
      }
    });

    return chats;
  };

  Chat.on('attached', () => {
    addSocketHandler(Chat, createChat, {});
    addSocketHandler(Chat, getChat, {eventName: 'get'});
  });
};
