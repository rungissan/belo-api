'use strict';

import kue from 'kue';

import config from '../../config/index';
const debug = require('debug')('spiti:jobs');

const redisKueConfig = config.redisKue;

import jobsHandlers from './handlers';

export default class KueJobs {
  constructor(app, config) {
    if (!app) {
      throw new Error('Job handler need loopback app in constructor');
    }
    this.app = app;
    this.config = config || redisKueConfig;
    this.queue = kue.createQueue(redisKueConfig);

    this.setupJobs();
  }

  setupJobs() {
    Object.keys(jobsHandlers).forEach(hadlerName => {
      this.queue.process(hadlerName, (job, done) => {
        return jobsHandlers[hadlerName].handler(this.app, job)
          .then(() => done())
          .catch(done);
      });
    });
  }

  createJob(jobName, data, options = {}) {
    if (!jobsHandlers[jobName]) {
      throw new Error('Incorrect job handler');
    }

    let jobOptions = jobsHandlers[jobName].options || {};
    jobOptions = {...jobOptions, ...options};

    let job = this.queue.create(jobName, data);

    job.ttl(jobOptions.ttl);
    job.delay(jobOptions.delay);
    job.attempts(jobOptions.attempts).backoff(jobOptions.backoff);

    job.save();

    debug(`Job ${jobName} created `);

    job.on('complete', function(result) {
      debug(`Job ${jobName} completed with result `, result);
    })
      .on('failed attempt', function(errorMessage, doneAttempts) {
        debug(`Job ${jobName} failed on attempt ${doneAttempts} with error`, errorMessage);
      })
      .on('failed', function(errorMessage) {
        debug(`Job ${jobName} failed with error`, errorMessage);
      })
      .on('progress', function(progress, data) {
        debug(`Job ${jobName} with id ${job.id}, progress ${progress} completed with data`, data);
      });
  }

  startUI() {
    kue.app.listen(4200);
  }

  getKueApp() {
    return kue.app;
  }
}
