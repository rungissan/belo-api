'use strict';

export default {
  cleanAttachmentsAfterMonth: {
    handler: cleanAttachmentsAfterMonth,
    options: {
      attempts: 1,
      backoff: {
        delay: 5 * 60 * 1000, // ms
        type: 'fixed'
      },
      removeOnComplete: true
    }
  }
};

async function cleanAttachmentsAfterMonth(app, job) {
  const {
    Feed,
    AttachmentToFeed,
    AttachmentToOpenHouse,
    Attachment
  } = app.models;
  let kueJobs = app.kueJobs;

  const DAYS_30 = 0; // 2592000000; // ms
  const StoragePath = '/usr/src/storage/public/uploads';

  const feedsToDelete = await Feed.find({
    where: {
      deleted_at: { neq: null },
      deleted_at : { lt: Date.now() - DAYS_30 }
    }
  });
  const imageToDeleteInPosts = feedsToDelete.filter(item=>item.type == 'post' && item.imageId).map(item => item.imageId);
  const imageToDeleteListings = feedsToDelete.filter(item=>item.type == 'listing'  && item.imageId).map(item => item.imageId);
  const imageToDeleteOpenHouses = feedsToDelete.filter(item=>item.type == 'openHouse'  && item.imageId).map(item => item.imageId);

  let listingToDelete = feedsToDelete.filter(item=>item.type == 'listing').map(item => item.id);
  let openHousesToDelete = feedsToDelete.filter(item=>item.type == 'openHouse').map(item => item.id);

  let feedAttachmentsToDelete = await AttachmentToFeed.find({
    fields: {attachmentId: true},
    where: {
      feedId : { inq: listingToDelete }
    }
  });

  let openHouseAttachmentsToDelete = await AttachmentToOpenHouse.find({
    fields: {attachmentId: true},
    where: {
      feedId : { inq: openHousesToDelete }
    }
  });

  let imageListingToDeleteAttachments = feedAttachmentsToDelete.map(item => item.attachmentId);

  let imageOpenHouseToDelete = openHouseAttachmentsToDelete.map(item => item.attachmentId);

  let  attachmentsToDeleteIds = [...new Set([...imageToDeleteInPosts,
    ...imageToDeleteListings,
    ...imageToDeleteOpenHouses,
    ...imageListingToDeleteAttachments,
    ...imageOpenHouseToDelete])];

  let  attachmentsToDelete = await Attachment.find({
    fields: {id: true, name:true, sizes:true},
    where: {
      id : { inq: attachmentsToDeleteIds }
    }
  });

  attachmentsToDelete.forEach(attachment => {
    if (attachment.name) {  kueJobs.createJob('deleteFile', {file:`${StoragePath}/${attachment.name}`}); }
    if (attachment.big && attachment.big.fileName) { kueJobs.createJob('deleteFile', {file:`${StoragePath}/${attachment.big.fileName}`}); }
    if (attachment.feed && attachment.feed.fileName) { kueJobs.createJob('deleteFile', {file:`${StoragePath}/${attachment.feed.fileName}`}); }
    if (attachment.thumbnail && attachment.thumbnail.fileName) { kueJobs.createJob('deleteFile', {file:`${StoragePath}/${attachment.thumbnail.fileName}`}); }
  });

  return true;
}
