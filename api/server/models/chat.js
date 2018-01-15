'use strict';

import Promise from 'bluebird';

import { addSocketHandler, sendToSocketByUserId, joinRoomByUserId } from '../lib/socket';
import { errUnauthorized, errValidation }  from '../lib/errors';
import ChatSearch from '../lib/search/chat';
import ChatMessageSearch from '../lib/search/chatMessage';

const ROOM_PREFIX = 'chatroom_';

module.exports = function(Chat) {
  async function getChats(socket, data = {}) {
    let { filter = {}, joinRooms } = data;
    let { user } = socket;

    const { ChatToAccount } = Chat.app.models;

    let query = {
      where: {
        fromId: user.id
      }
    };
    const chatSearch = new ChatSearch(Chat.app.dataSources.postgres.connector, Chat.app, {baseModelName: 'Chat'});
    let chats = await chatSearch.queryChats(query);

    if (joinRooms || typeof joinRooms === 'undefined') {
      scocketJoinChatRooms(socket, chats);
    }

    return chats;
  };

  async function readChat(socket, data = {}) {
    let { chatId, messageId } = data;
    let { user } = socket;

    if (!chatId) {
      throw errValidation('chatId required');
    }

    const { ChatMessage, ChatToAccount } = Chat.app.models;

    let linkedAccount = await ChatToAccount.findOne({where: {userId: user.id, chatId}});

    if (!linkedAccount) {
      throw errUnauthorized();
    }

    let readedMessage;
    if (messageId) {
      readedMessage = await ChatMessage.findOne({where: {chatId, id: messageId}});
    } else {
      readedMessage = await ChatMessage.findOne({
        where: {chatId},
        order: 'id DESC',
        limit: 1
      });
    }

    if (readedMessage && readedMessage.id) {
      await linkedAccount.updateAttributes({lastReadedMessageId: readedMessage.id});
    }

    return {lastReadedMessageId: readedMessage && readedMessage.id || null};
  };

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
    let { chatId, earlierThanId, limit, offset, order, include } = data;

    const { ChatMessage, ChatToAccount } = Chat.app.models;

    let linkedAccount = await ChatToAccount.findOne({where: {userId: user.id, chatId}});

    if (!linkedAccount) {
      throw errUnauthorized();
    }

    let query = {
      where: { chatId },
      limit: limit || 10,
      offset: offset || 0,
      order: order || ['id DESC']
    };

    query.include = include || {
      relation: 'account',
      scope: { include: { relation: 'avatar' }}
    };

    if (earlierThanId) {
      query.where.id = {'lt': earlierThanId};
    }

    let chats = await ChatMessage.find(query);

    return chats;
  };

  async function searchMessages(socket, data = {}) {
    let { user } = socket;
    let { limit, offset, where = {} } = data;
    limit = Number(limit) || 10;
    offset = Number(offset) || 0;

    const messageSearch = new ChatMessageSearch(Chat.app.dataSources.postgres.connector, Chat.app, {baseModelName: 'ChatMessage'});

    let query = {
      where: {
        chatToAccount: { userId: user.id},
        searchString: where.searchString
      },
      include: ['account'],
      limit: data.limit,
      offset: data.offset
    };
    where.chatId && (query.where.chatId = where.chatId);

    return await messageSearch.query(query, {userId: user.id});
  };

  async function findOrCreateChat(socket, data = {}) {
    let { user } = socket;
    let { type = 'personal', title, accountToId } = data;
    const { Account } = Chat.app.models;

    let accountTo = await Account.findById(accountToId);
    if (!accountTo) {
      throw new Error('Account not found');
    }

    let existentChat = await findChatWithType(user.id, accountToId, type);
    if (existentChat) {
      return existentChat;
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

      let participants = await ChatToAccountModel.create(connectedAccounts);
    });

    let chatData = createdChat.toJSON();
    let accountFrom = await Account.findById(user.id);
    chatData.participants = [accountTo, accountFrom];

    let recipientSocketIds = await joinRoomByUserId(Chat.app, accountTo.id, getRoomName(chatData.id));
    if (recipientSocketIds && recipientSocketIds.length) {
      recipientSocketIds.forEach(recipientSocketId => {
        Chat.app.io.to(recipientSocketId).emit('chatCreated', chatData);
      });
    }

    return createdChat;
  };

  async function sendMessage(socket, data = {}) {
    let { user } = socket;
    let { message, chatId } = data;

    if (!message) {
      throw errValidation('message required');
    }

    const { ChatMessage, ChatToAccount } = Chat.app.models;

    let linkedAccount = await ChatToAccount.findOne({where: {userId: user.id, chatId}});

    if (!linkedAccount) {
      throw errUnauthorized();
    }

    let createdMessage = await ChatMessage.create({
      chatId,
      userId: user.id,
      message
    });
    await linkedAccount.updateAttributes({lastReadedMessageId: createdMessage.id});

    socket.to(getRoomName(chatId)).emit('messageCreated', createdMessage);

    return createdMessage;
  };

  Chat.on('attached', () => {
    addSocketHandler(Chat, getChats, {eventName: 'getChats'});
    addSocketHandler(Chat, readChat, {eventName: 'readChat'});
    addSocketHandler(Chat, sendMessage, {eventName: 'sendMessage', validationSchema: 'sendMessage'});
    addSocketHandler(Chat, searchMessages, {eventName: 'searchMessages'});
    addSocketHandler(Chat, findOrCreateChat, {eventName: 'findOrCreateChat'});
    addSocketHandler(Chat, getChat, {eventName: 'get'});
    addSocketHandler(Chat, getMessages, {eventName: 'getMessages', validationSchema: 'getMessages'});
  });

  function scocketJoinChatRooms(socket, chats) {
    return socket.join(chats.map(c => getRoomName(c.id)));
  }

  function getRoomName(roomId) {
    return `${ROOM_PREFIX}${roomId}`;
  }

  async function findChatWithType(fromId, toId, type) {
    if (!(fromId && toId && type)) {
      return false;
    }

    let query = {
      where: { fromId, toId, type }
    };
    const chatSearch = new ChatSearch(Chat.app.dataSources.postgres.connector, Chat.app, {baseModelName: 'Chat'});

    let existentChats = await chatSearch.querySearchChat(query);
    return existentChats && existentChats[0] || false;
  }
};
