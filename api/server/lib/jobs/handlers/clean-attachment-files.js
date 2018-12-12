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
  // .filter(file => (file.indexOf('.') !== 0))
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
     console.log('I am here');
     if (!attachment) {
         console.log('I am inside');
         console.log(`${StoragePath}/${file}`);
         kueJobs.createJob('deleteFile',{file:`${StoragePath}/${file}`})
     
     };
   });

  return true;
}