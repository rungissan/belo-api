'use strict';

module.exports = (app) => {
  var postgres = app.dataSources.postgres;
  const tables = ['User','Account'];
 // console.log('-- Models found:', Object.keys(tables));
 

   tables.forEach(model => {
    console.log('Cheking if table for model ' + model + ' is created and up-to-date in DB...');
    console.log(model);
    if (model === 'Account') console.log('Я нормально определил');
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
