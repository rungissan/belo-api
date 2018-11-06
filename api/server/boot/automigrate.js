'use strict';

module.exports = (app) => {
  var postgres = app.dataSources.postgres;
  const tables = [];
  console.log('-- Models found:', Object.keys(tables));
 ``

   tables.forEach(model => {
    console.log('Cheking if table for model ' + model + ' is created and up-to-date in DB...');
    console.log(model);
   
    postgres.isActual(model, (err, actual) => {
      if (actual) {
        console.log('Model ' + model + ' is up-to-date. No auto-migrated.');
      } else {
        console.log('Difference found! Auto-migrating model ' + model + '...');
        postgres.autoupdate(model, () => {
           console.log('Auto-migrated model ' + model + ' successfully.');
        });
      }
    });
  });
 };
