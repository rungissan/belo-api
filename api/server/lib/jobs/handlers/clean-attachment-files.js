'use strict';

import fs from 'fs';

export default {
  cleanAttachmentFiles: {
    handler: cleanAttachmentFiles,
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

async function cleanAttachmentFiles(app, job) {
  const {
    Attachment
  } = app.models;
  let kueJobs = app.kueJobs;
  const StoragePath = '/usr/src/storage/public/uploads';

  fs.readdirSync(StoragePath)
   .forEach(async(file) => {
     console.log(file);
     const attachment = await Attachment.findOne({
       where: {
         or: [{
           name: file
         },
         {
           'sizes.big.fileName': file
         },
         {
           'sizes.feed.fileName': file
         },
         {
           'sizes.thumbnail.fileName': file
         }
         ]
       }
     });
     if (!attachment) {
       kueJobs.createJob('deleteFile', {file:`${StoragePath}/${file}`});
     };
   });

  return true;
}
