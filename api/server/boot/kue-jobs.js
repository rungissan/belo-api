'use strict';

import KueJobs from '../lib/jobs';

module.exports = (app) => {
  app.kueJobs = new KueJobs(app);

  app.use('/jobs', app.kueJobs.getKueApp());

  
  app.kueJobs.createJob('cleanAttachmentFiles');
  // app.kueJobs.createJob('sendEmail',
  // {	title:	'Cleaning Supplies',
  // supplies:	['mop', 'broom', 'duster'],
  // path: '/usr/src/storage/public/uploads/a6170b98-6b47-4b6d-8dd0-688725ed5d14_thumbnail.JPG'	}
  // );
  
};
