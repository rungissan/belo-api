'use strict';

module.exports = function(app, cb) {
  updateDatabaseSchema(app).then(() => {
    process.nextTick(cb);
  });
};

async function updateDatabaseSchema(app) {
  let datastore = app.datasources.postgres;

  for (let model of app.models()) {
    
    if (model.modelName == 'Review') {
    //  console.log(model);
    if (await doesModelNeedUpdate(datastore, model.modelName) === true) {
      try {
        await updateSchemaForModel(datastore, model.modelName);
      }
      catch(error) {
        console.error(error);
      }
    }
  }
  }
}

function doesModelNeedUpdate(datastore, model) {
  return new Promise((resolve, reject) => {
    datastore.isActual(model, (err, actual) => {
      if (err) reject(err);
      resolve(!actual);
    });
  });
}

function updateSchemaForModel(datastore, model) {
  return new Promise((resolve, reject) => {
    datastore.autoupdate(model, (err, result) => {
      if (err) reject(err);
      console.log(`Autoupdate performed for model ${model}`);
      resolve();
    });
  });
}
