'use strict';

import path       from 'path';
import { randomString } from 'lib/util';

export default function(Client) {
  // TODO remove this after issue fixed
  // If use rejectPasswordChangesViaPatchOrReplace option to allow password change only via changePassword() or setPassword()
  // there is a bug when try to validate/confirm user - https://github.com/strongloop/loopback/issues/3393
  // because user user.save() method that try to update all user properties.
  // Temporary workaround - check password update in remote hooks.
  function rejectInsecurePasswordChange(ctx, client, next) {
    let data = ctx.args && (ctx.args.data || ctx.args.instance) || {};

    if (!data.password) {
      return next();
    }

    const err = new Error(
      'Changing user password via patch/replace API is not allowed. ' +
      'Use password reset instead');
    err.statusCode = 401;
    err.code = 'PASSWORD_CHANGE_NOT_ALLOWED';
    next(err);
  }

  [
    'replaceById',
    'updateAll',
    '*.patchAttributes',
    'patchOrCreate',
    'replaceOrCreate',
    'upsertWithWhere',
    'upsert',
    'updateAll',
    'bulkUpdate',
    'upsertWithWhere',
    'replaceOrCreate',
    'replaceById',
    'findOrCreate'
  ].forEach(remoteHook => Client.beforeRemote(remoteHook, rejectInsecurePasswordChange));

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
