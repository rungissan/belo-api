'use strict';
import fs from 'fs';

export default {
  deleteFile: {
    handler: deleteFile,
    options: {
      delay: 1500, // ms
      attempts: 3,
      backoff: {
        delay: 5000, // ms
        type: 'fixed'
      },
      removeOnComplete: true
    }
  }
};

async function deleteFile(app, job) {
 
  let data = job.data || {};

  if (!data.file) {
    return true;
  }
  fs.unlinkSync(data.file);

  return true;
}

