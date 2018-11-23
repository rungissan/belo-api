'use strict';

import Search from '../../search';

export default {
  cleanOpenHouses: {
    handler: cleanOpenHouses,
    runOnStart: true,
    runOnStartData: {},
    options: {
      attempts: 10,
      backoff: {
        delay: 5 * 60 * 1000, // ms
        type: 'fixed'
      },
      schedule: {
        every: '0 0 * * * *',
        unique: true
      }
    }
  }
};

async function cleanOpenHouses(app, job) {
  const { OpenHouse, Feed } = app.models;
  await deleteAllOldOpenHouses(app);
  return true;
}

async function deleteAllOldOpenHouses(app) {
  const haveMoreOldOpenHouses = await deleteOpenHouses(app);

  if (haveMoreOldOpenHouses) {
    return await deleteAllOldOpenHouses(app);
  }

  return true;
}

async function deleteOpenHouses(app) {
  const { OpenHouse, Feed } = app.models;

  const oldOpenHousesSearch = new Search(app.dataSources.postgres.connector, app, {baseModelName: 'Feed'});

  let idsSearchFilter = {
    where: {
      type: 'openHouse',
      openHouse: {
        timeEnd: { lt: new Date() }
      }
    },
    order: 'id ASC',
    limit: 10
  };

  let oldOpenHouses = await oldOpenHousesSearch.query(idsSearchFilter);
  if (!(oldOpenHouses && oldOpenHouses.length)) {
    return false;
  }

  let oldOpenHousesIds = oldOpenHouses.map(f => f.id);
  await Feed.destroyAll({ id: {inq: oldOpenHousesIds}});

  return true;
}
