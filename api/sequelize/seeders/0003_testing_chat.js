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
  ChatMessage
} = server.models;

let CLIENTS = new Array(1000).fill(null).map((c, id) => {
  return {
    username: `TestChat_${id}`,
    firstname: `test_${id}`,
    lastname: `chat_${id}`,
    email: `test_${id}@chat.c`,
    password: 'testtest'
  };
});

module.exports = {
  up() {
    return Role.findOne({name: 'prof'})
      .then(role => {
        return Promise.mapSeries(CLIENTS, clientData => {
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
        });
      })
      .then(accounts => {
        return addTestChats(accounts);
      });
  },
  down() {
    return true;
  }
};


// delete from spiti.user where id > 6;
// delete from spiti.rolemapping where principalid::int > 6;

function addTestChats(accounts) {
  let accountIds = accounts.map(a => a.userId);
  let accLength = accounts.length;
  let accountPairs = [];
  let filteredPairs = [];

  for (let i = 1; i < accounts.length * 20; i++) {
    accountPairs.push({
      fromId: Math.floor(Math.random() * (accLength - 1)),
      toId: Math.floor(Math.random() * (accLength - 1))
    });
  }
  console.log('accountPairs.............', accountPairs)

  accountPairs.forEach(pair => {
    let existent = filteredPairs.find(existentPair => {
      return (existentPair.fromId === pair.fromId && existentPair.toId === pair.toId) ||
        (existentPair.fromId === pair.toId && existentPair.fromId === pair.toId);
    });

    if (!existent) {
      filteredPairs.push(pair);
    }
  });

  console.log('filteredPairs.............', filteredPairs)
  // return Promise.map(accountPairs, chatParticipants => {
  //   let account
  // });
}
