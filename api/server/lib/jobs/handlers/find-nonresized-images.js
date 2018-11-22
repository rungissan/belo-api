
'use strict';

export default {
  nonResizedImages: {
    handler: nonResizedImages,
    runOnStart: true,
    runOnStartData: {},
    options: {
      attempts: 1,
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

async function nonResizedImages(app, job) {
  const { Attachment } = app.models;
  let kueJobs = app.kueJobs;

  const attachmentsToResize = await Attachment.find({
    where: {
      sizes: {}
    }
  });
  console.log('*******************************');
  console.log(attachmentsToResize.length);
  console.log('*******************************');
  attachmentsToResize.forEach(attachment => kueJobs.createJob('createImgCopies', attachment));

  return true;
}
