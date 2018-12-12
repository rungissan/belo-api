'use strict';
import path from 'path';

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
const StoragePath = '/usr/src/storage/public/uploads';

async function sendEmail(app, job) {
 
  let data = job.data || {};

 
  console.log(data);
  let renderer = app.loopback.template(path.resolve(__dirname, '../../../views/ban-request.ejs'));
 
  
  let options = {
    type: 'email',
    to: 'yury@samoshk.in',
    from: 'test@domain.com',
    subject: 'Ban request.',
    html: renderer(data),
    user: 'abuser'
  };
  
    await app.models.Email.send(options);
    return true;
   
}   