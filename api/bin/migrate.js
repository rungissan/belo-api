'use strict';

const path   = require('path');

const server = require(path.resolve(__dirname, '../server/server.js'));

const postgres = server.dataSources.postgres;

const base = ['User', 'AccessToken', 'ACL', 'RoleMapping', 'Role'];

const custom = ['Client', 'Zipcode'];
const lbTables = [].concat(base, custom);

// Run through and create all of them
postgres.autoupdate(lbTables)
  .catch(err => {
    console.log('migration error ', err);
  })
  .then(() => {
    postgres.disconnect();
    process.exit(0);
  });
// postgres.automigrate(lbTables, function (err) {
//   if (err) throw err
//   console.log(' ')
//   console.log('Tables [' + lbTables + '] reset in ' + mysql.adapter.name)
//   console.log(' ')
//   mysql.disconnect()
//   process.exit(0)
// })
