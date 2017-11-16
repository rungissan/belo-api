'use strict';

const debug = require('debug')('spiti:boot');

module.exports = (app) => {
  let ContainerPrivate = app.models.ContainerPrivate;
  let ContainerPublic  = app.models.ContainerPublic;

  createContainersIfNotExist(ContainerPrivate, ContainerPrivate.settings.validContainers);
  createContainersIfNotExist(ContainerPublic,  ContainerPublic.settings.validContainers);
};

function createContainersIfNotExist(StorageContainer, directories = []) {
  StorageContainer.getContainers(function (err, containers) {
    if (err) {
      debug('Containers boot error: ', err);
    }

    directories.forEach(directory => {
      if (!containers.some(c => c.name == directory)) {
        StorageContainer.createContainer({name: directory}, function(err, c) {
          if (err) {
            debug('Containers boot error: ', err);
          } else {
            debug(`Container ${directory} was created`);
          }
        });
      }
    })
  });
}
