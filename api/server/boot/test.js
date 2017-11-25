'use strict';

import Promise from 'bluebird';

module.exports = (app) => {
  const models = Object.keys(app.models).map(name => app.models[name]);

  Promise.mapSeries(models, model => {
    console.log('modelname', model.modelName);

    if (!['User', 'AccessToken', 'ACL', 'RoleMapping', 'Role', 'Application'].includes(model.modelName)) {
      return model.find();
    }
  })
    .then(resutl => console.log('fin.....'))
    .catch(err => console.log(err));
};
