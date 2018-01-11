'use strict';

const Promise = require('bluebird');

const path    = require('path');
const server  = require(path.resolve(__dirname, '../../server/server.js'));
import { chunk as _chunk } from 'lodash';

const {
  Role,
  Client,
  RoleMapping,
  Account,
  Chat,
  ChatMessage,
  ChatToAccount
} = server.models;
//
// let CLIENTS = new Array(30).fill(null).map((c, id) => {
//   let i = id + 350;
//   return {
//     username: `TestChat_${i}`,
//     firstname: `test_${i}`,
//     lastname: `chat_${i}`,
//     email: `test_${i}@chat.c`,
//     password: 'testtest'
//   };
// });

module.exports = {
  up() {
    return Promise.mapSeries(new Array(30).fill(null), (val, i) => {
      console.log('i...............', i);
      let clientsOptions = getRandomClients(i);
      return addClients(clientsOptions);
    });
  },
  down() {
    return true;
  }
};
const startId = 2000;
const quantity = 30;

function getRandomClients(totalId) {
  return new Array(30).fill(null).map((c, id) => {
    let i = id + startId + quantity * totalId;

    return {
      username: `TestChat_${i}`,
      firstname: `test_${i}`,
      lastname: `chat_${i}`,
      email: `test_${i}@chat.c`,
      password: 'testtest'
    };
  });
}

function addClients(clientsOptions) {
  return Role.findOne({name: 'prof'})
    .then(role => {
      return Promise.map(clientsOptions, clientData => {
        return Client.create(clientData)
          .then(client => {
            return role.principals.create({
              principalType: RoleMapping.USER,
              principalId: client.id
            })
              .then(() => {
                return client.account.create({});
              });
          });
      }, {concurrency: 10});
    })
    .then(accounts => {
      return addTestChats(accounts);
    });
}

// delete from spiti.user where id > 15;
// delete from spiti.rolemapping where principalid::int > 15;
// delete from spiti.chat;
// delete from "SequelizeData" where name = '0003_testing_chat.js';

function addTestChats(accounts) {
  let accountIds = accounts.map(a => a.userId);
  let accLength = accountIds.length;
  let accountPairs = [];
  let accountToChatPairs = [];

  for (let i = 1; i < accounts.length * 50; i++) {
    let rndFrom = Math.floor(Math.random() * accLength);
    let rndTo = Math.floor(Math.random() * accLength);
    if (rndFrom !== rndTo) {
      accountPairs.push({
        fromId: accountIds[rndFrom],
        toId: accountIds[rndTo]
      });
    }
  }

  accountPairs.forEach(pair => {
    let existent = accountToChatPairs.find(existentPair => {
      return (existentPair.fromId === pair.fromId && existentPair.toId === pair.toId) ||
        (existentPair.fromId === pair.toId && existentPair.fromId === pair.toId);
    });

    if (!existent) {
      accountToChatPairs.push(pair);
    }
  });

  let bulkChats = [];
  let bulkAccountToChatPairs = [];
  let bulkMessages = [];
  accountToChatPairs.forEach((pair, index) => {
    bulkChats.push({
      title: `chat: ${index} between ${pair.fromId} and ${pair.toId}`,
      type: 'personal'
    });
  });

  return Chat.create(bulkChats)
    .then(createdChats => {
      createdChats.forEach((createdChat, i) => {
        if (accountToChatPairs[i]) {
          bulkAccountToChatPairs.push({
            userId: accountToChatPairs[i].fromId,
            chatId: createdChat.id
          });
          bulkAccountToChatPairs.push({
            userId: accountToChatPairs[i].toId,
            chatId: createdChat.id
          });

          let msgCount = Math.floor(Math.random() * 500) + 5;
          for (let j = 0; j < msgCount; j++) {
            bulkMessages.push({
              chatId: createdChat.id,
              userId: (j % 3) ? accountToChatPairs[i].fromId : accountToChatPairs[i].toId,
              message: `test msg ${i} for chat ${createdChat.id}`
            });
          }
        }
      });

      return ChatToAccount.create(bulkAccountToChatPairs);
    })
    .then(() => ChatMessage.create(bulkMessages));
}
