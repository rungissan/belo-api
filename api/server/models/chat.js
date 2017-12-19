'use strict';

import Promise from 'bluebird';

import { addSocketHandler } from '../lib/socket';
import { errUnauthorized }  from '../lib/errors';
import Search from '../lib/search';

module.exports = function(Chat) {
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

  async function getMessages(socket, data = {}) {
    let { user } = socket;
    let { chatId, filter = {} } = data;

    const { ChatMessage, ChatToAccount } = Chat.app.models;

    let linkedAccount = await ChatToAccount.findOne({where: {userId: user.id, chatId}});

    if (!linkedAccount) {
      throw errUnauthorized();
    }

    let chats = await ChatMessage.find({
      where: { chatId },
      include: {
        relation: 'account',
        scope: {
          include: {
            relation: 'avatar'
          }
        }
      },
      limit: filter.limit || 10,
      offset: filter.offset || filter.skip || 0,
      order: filter.order || ['created_at DESC']
    });

    return chats;
  };

  async function findOrCreate(socket, data = {}) {
    let { user } = socket;
    let { type = 'personal', title, accountToId } = data;
    const { Account } = Chat.app.models;

    let accountTo = await Account.findById(accountToId);
    if (!accountTo) {
      throw new Error('Account not found');
    }

    let where = {
      and: [{
        account: { userId: user.id }
      }, {
        account: { userId: accountToId }
      }],
      type
    };
    const chetSearch = new Search(Chat.app.dataSources.postgres.connector, Chat.app, {baseModelName: 'Chat'});

    let existentChat = await chetSearch.query({where});
    if (existentChat && existentChat[0]) {
      return existentChat[0];
    }

    let createdChat;
    await Chat.app.dataSources.postgres.transaction(async models => {
      const ChatModel          = models.Chat;
      const ChatToAccountModel = models.ChatToAccount;

      createdChat = await ChatModel.create({title, type});

      let connectedAccounts = [{
        userId: user.id,
        chatId: createdChat.id
      }, {
        userId: accountTo.id,
        chatId: createdChat.id
      }];

      await ChatToAccountModel.create(connectedAccounts);
    });

    return createdChat;
  };

  Chat.on('attached', () => {
    addSocketHandler(Chat, findOrCreate, {eventName: 'findOrCreate'});
    addSocketHandler(Chat, getChat, {eventName: 'get'});
    addSocketHandler(Chat, getMessages, {eventName: 'getMessages'});
  });
};
