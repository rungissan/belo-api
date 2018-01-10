'use strict';

import Promise from 'bluebird';

import { addSocketHandler } from '../lib/socket';
import { errUnauthorized }  from '../lib/errors';
import Search from '../lib/search';

//
// SELECT "chat".*,
//        "participants",
//        "messages"
// FROM (
//   SELECT "Chat"."id"
//   FROM "spiti"."chat" AS "Chat"
//   INNER JOIN "spiti"."chat_to_account" AS "chat_to_account_from" ON "chat_to_account_from"."chatId" = "Chat"."id"
//     AND "chat_to_account_from"."userId" = 3
//   INNER JOIN "spiti"."chat_to_account" AS "chat_to_account_to" ON "chat_to_account_to"."chatId" = "Chat"."id"
//     AND "chat_to_account_to"."userId" = 4
// ) AS "filteredChat"
//
// INNER JOIN "spiti"."chat" AS "chat" ON "chat"."id" = "filteredChat"."id"
// LEFT JOIN LATERAL (
//   SELECT
//     jsonb_agg("participant".*) AS "participant"
//   FROM "spiti"."chat_to_account" AS "chat_to_account"
//     LEFT OUTER JOIN "spiti"."account" AS "participant" ON "chat_to_account"."userId" = "participant"."userId"
//   WHERE "chat_to_account"."chatId" = "chat"."id"
// ) "participants" ON true
// LEFT JOIN LATERAL (
//   SELECT
//     json_agg("message".*) AS "message"
//   FROM "spiti"."chat_message" AS "message"
//   WHERE "message"."chatId" = "chat"."id"
// ) "messages" ON true
//
// LIMIT 10
// OFFSET 0;
//

module.exports = function(Chat) {
  async function getChat(socket, data = {}) {
    let { filter = {} } = data;
    let { user } = socket;

    const { ChatToAccount } = Chat.app.models;

    let chatConnections = await ChatToAccount.find({
      where: { userId: user.id },
      include: {
        relation: 'chat',
        scope: {
          include: [{
            relation: 'image'
          }, {
            relation: 'account'
          }]
        }
      }
    });

    return chatConnections.map(c => c.toJSON().chat);
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

    let query = {
      where: {
        or: [{
          account: { userId: user.id }
        }, {
          account: { userId: accountToId }
        }],
        type
      },
      queryOptions: {
        groupBy: {modelName: 'Chat', column: 'id'},
        selectFunctions: [{fn: 'arrayAgg', modelName: 'account', column: 'userId', as: 'participants'}]
      }
    };
    const chatSearch = new Search(Chat.app.dataSources.postgres.connector, Chat.app, {baseModelName: 'Chat'});

    let existentChats = await chatSearch.query(query);
    if (existentChats.length) {
      let existentChat = existentChats.find(chat => {
        return [user.id, accountToId].every(uId => chat.participants.includes(uId));
      });

      if (existentChat) {
        return existentChat;
      }
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

  // TODO: implement sendMessage
  async function sendMessage(socket, data = {}) {
    let { user } = socket;
    let { message, chatId } = data;

    const { ChatMessage, ChatToAccount } = Chat.app.models;

    let linkedAccount = await ChatToAccount.findOne({where: {userId: user.id, chatId}});

    if (!linkedAccount) {
      throw errUnauthorized();
    }

    return true;
    // let createdMessage = ChatMessage.create();
  };

  Chat.on('attached', () => {
    addSocketHandler(Chat, findOrCreate, {eventName: 'findOrCreate'});
    addSocketHandler(Chat, getChat, {eventName: 'get'});
    addSocketHandler(Chat, getMessages, {eventName: 'getMessages'});
  });
};
