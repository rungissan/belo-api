'use strict';

import KueJobs from '../lib/jobs';

module.exports = (app) => {
  app.kueJobs = new KueJobs(app);

  app.use('/jobs', app.kueJobs.getKueApp());

 // app.kueJobs.createJob('cleanAttachmentFiles');
 // app.kueJobs.createJob('cleanAttachmentsAfterMonth');

};
