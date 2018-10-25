'use strict';

export default {
    cleanListings: {
        handler: cleanListings,
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

async function cleanListings(app, job) {
    await deleteOpenHouses(app);
    return true;
}

async function deleteOpenHouses(app) {

    const { 
        StatusCheck,
        Appointment,
        Feed
    } = app.models;
  
    const DAYS_30 = 2592000000; //ms

    const listingsToDelete = await Feed.find({
      where: {
        type: 'listing',
        feedStatus: { nin: [1] },
        expiration: { lt: Date.now() - DAYS_30 }
      }
    })

    // if(listingsToDelete.length){
    //   const openHousesToDelete = await Feed.find({
    //     where: { or: listingsToDelete.map(item => {return { parentId: item.id }}) }
    //   })
    //   if(openHousesToDelete.length){
    //     openHousesToDelete.forEach(async item => {
    //       await StatusCheck.destroyAll({ feedId: item.id })
    //       await Appointment.destroyAll({ feedId: item.id })
    //       await Feed.destroyAll({ id: item.id })
    //     })
    //   }
    //   listingsToDelete.forEach(async item => {
    //     await StatusCheck.destroyAll({ feedId: item.id })
    //     await Appointment.destroyAll({ feedId: item.id })
    //     await Feed.destroyAll({ id: item.id })
    //   })
    // }
  
    return true;
}