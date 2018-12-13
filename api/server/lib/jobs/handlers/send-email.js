'use strict';

export default {
  sendEmail: {
    handler: sendEmail,
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

async function sendEmail(app, job) {
 
  const options = job.data;
 
  if (!options) {
    return false
  }
  console.log(options);

  await app.models.Email.send(options);
  return true;
   
}   