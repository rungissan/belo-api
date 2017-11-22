'use strict';

import KueJobs from '../lib/jobs';

module.exports = (app) => {
  app.kueJobs = new KueJobs(app);
  app.kueJobs.startUI();

  app.use('/jobs', app.kueJobs.getKueApp());
};
