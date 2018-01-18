'use strict';

// import kue from 'kue';
import kue from 'kue-scheduler';

import appConfig from '../../config/index';
const debug = require('debug')('spiti:jobs');

const redisKueConfig = appConfig.redisKue;

import jobsHandlers from './handlers';

export default class KueJobs {
  constructor(app, config) {
    if (!app) {
      throw new Error('Job handler need loopback app in constructor');
    }
    this.app = app;
    this.config = config || redisKueConfig;

    this.setupQueue();
    this.setupJobs();

    if (appConfig.nodeEnv !== 'test') {
      this.createInitialJobs();
    }
  }

  setupQueue() {
    this.queue = kue.createQueue(this.config);

    this.queue.on('error', function(err) {
      debug('Kue job error', err);
      console.log('Kue job error', err);
    });

    this.queue.watchStuckJobs();

    process.once('SIGTERM', function(sig) {
      this.queue.shutdown(5000, function(err) {
        debug('Kue shutdown: ', err || '');
        console.log('Kue shutdown: ', err || '');
        process.exit(0);
      });
    });
  }

  setupJobs() {
    Object.keys(jobsHandlers).forEach(hadlerName => {
      this.queue.process(hadlerName, (job, done) => {
        return jobsHandlers[hadlerName].handler(this.app, job)
          .then(result => done(null, result))
          .catch(done);
      });
    });
  }

  createInitialJobs() {
    Object.keys(jobsHandlers).forEach(hadlerName => {
      let handlerOptions = jobsHandlers[hadlerName];

      if (handlerOptions.runOnStart) {
        debug('run initial job: ', hadlerName);
        this.createJob(hadlerName, handlerOptions.runOnStartData || {});
      }
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
    job.removeOnComplete(jobOptions.removeOnComplete);

    if (jobOptions.schedule) {
      let { every, unique } = jobOptions.schedule;

      unique && job.unique(jobName);
      every && this.queue.every(every, job);
    }

    job.save();

    debug(`Job ${jobName} created `);

    // NOTE: events won't fire after process restart. if need reliable events, use queue-events https://github.com/Automattic/kue#queue-events
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

  getKueApp() {
    return kue.app;
  }
}
