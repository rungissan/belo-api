'use strict';

import path       from 'path';
import { randomString } from 'lib/util';

export default function(Client) {
  Client.afterRemote('create', function(context, client, next) {
    let options = {
      type: 'email',
      to: client.email,
      from: 'test@domain.com',
      subject: 'Thanks for registering.',
      template: path.resolve(__dirname, '../../server/views/verify.ejs'),
      user: client,
      generateVerificationToken: generateUserVerifyToken
    };

    client.verify(options)
      .then(response => {
        return next();
      })
      .catch(err => {
        Client.deleteById(client.id);
        return next(err);
      });
  });

  Client.on('resetPasswordRequest', function(info) {
    var url = 'http://' + 'localhost' + '/reset-password';
    var html = 'Click <a href="' + url + '?access_token=' +
        info.accessToken.id + '">here</a> to reset your password';

    Client.app.models.Email.send({
      to: info.email,
      from: info.email,
      subject: 'Password reset',
      html: html
    }, function(err) {
      if (err) return console.log('> error sending password reset email');
      console.log('> sending password reset email to:', info.email);
    });
  });
};

function generateUserVerifyToken(user, options, cb) {
  cb(null, randomString(7));
}
