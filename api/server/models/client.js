'use strict';

import path       from 'path';
import Promise from 'bluebird';
import { randomString } from 'lib/util';
import {
  userNotFound,
  invalidVerificationToken,
  emailNotFound,
  emailNotVerified
} from 'lib/errors';

const DEFAULT_VERIFICATION_TTL = 900;

export default function(Client) {
  Client.prototype.createVerificationToken = function(tokenData) {
    const clientSettings = this.constructor.settings;
    tokenData.ttl = Math.min(tokenData.ttl || clientSettings.ttl, clientSettings.maxTTL);
    return this.verificationTokens.create(tokenData);
  };

  Client.prototype.verifyEmail = function(verifyOptions) {
    let client = this;
    let registry = Client.registry;
    verifyOptions = Object.assign({}, verifyOptions);

    verifyOptions.mailer = verifyOptions.mailer || Client.email;

    var defaultTemplate = path.join(__dirname, '..', '..', 'templates', 'verify.ejs');
    verifyOptions.template = path.resolve(verifyOptions.template || defaultTemplate);
    verifyOptions.user = client;

    const app = Client.app;

    return client.createVerificationToken({
      scopes: ['email_verification'],
      ttl: DEFAULT_VERIFICATION_TTL
    })
      .then(verificationToken => {
        verifyOptions.code = verificationToken.id;
        verifyOptions.verificationToken = verificationToken;
        verifyOptions.text = verificationToken.id;

        var template = Client.app.loopback.template(verifyOptions.template);
        var body = template(verifyOptions);

        const Email = verifyOptions.mailer;
        return Email.send(verifyOptions);
      });
  };

  Client.afterRemote('create', function(context, client, next) {
    let options = {
      type: 'email',
      to: client.email,
      from: 'test@domain.com',
      subject: 'Thanks for registering.',
      template: path.resolve(__dirname, '../../server/views/verify.ejs'),
      user: client
    };

    client.verifyEmail(options)
      .then(response => {
        return next();
      })
      .catch(err => {
        Client.deleteById(client.id);
        return next(err);
      });
  });

  Client.confirmEmail = function(userId, code, next) {
    return this.findById(userId)
      .then(client => {
        if (!client) {
          throw userNotFound(userId);
        }

        return Client.app.models.VerificationToken.findOne({
          where: {
            id: code,
            userid: userId
          }
        })
          .then(verificationToken => {
            if (!verificationToken) {
              throw invalidVerificationToken(code);
            }

            return verificationToken.validate({scope: 'email_verification'})
              .then(isValid => {
                if (!isValid) {
                  throw invalidVerificationToken(code);
                }

                return verificationToken.delete();
              })
              .then(() => {
                client.emailVerified = true;
                return client.save();
              });
          });
      })
      .catch(next);
  };

  Client.remoteMethod('confirmEmail', {
    accepts: [{
      arg: 'userId',
      type: 'number'
    }, {
      arg: 'code',
      type: 'string'
    }],
    description: 'Confirm a user email with verification token.',
    http: {verb: 'get', path: '/confirm-email'}
  });

  Client.passwordReset = function(email, next) {
    return Client.findOne({where: {email}})
      .then(client => {
        if (!client) {
          throw emailNotFound();
        }

        if (!client.emailVerified) {
          throw emailNotVerified();
        }

        return client.createVerificationToken({
          scopes: ['password_reset'],
          ttl: DEFAULT_VERIFICATION_TTL
        });
      })
      .then(verificationToken => {
        let verifyOptions = {
          code: verificationToken.id,
          text: verificationToken.id,
          type: 'email',
          to: email,
          from: 'test@domain.com',
          subject: 'Password reset.',
          template: path.resolve(__dirname, '../../server/views/password-reset.ejs'),
        }

        var template = Client.app.loopback.template(verifyOptions.template);
        var body = template(verifyOptions);

        const Email = Client.email;
        return Email.send(verifyOptions);
      })
      .catch(next);
  };

  Client.remoteMethod(
    'passwordReset',
    {
      description: 'Reset password for a user with email.',
      accepts: [
        {arg: 'email', type: 'string', required: true}
      ],
      http: {verb: 'post', path: '/password-reset'},
    }
  );

  Client.passwordUpdate = function(email, code, newPassword, next) {
    console.log('.............validatePassword....', Client.validatePassword);
    // return Client.validatePassword(newPassword)

    return new Promise((resolve, reject) => {
      return resolve(Client.validatePassword(newPassword))
    })
      .then(() => {
        return Client.findOne({where: {email}});
      })
      .then(client => {
        if (!client) {
          throw emailNotFound();
        }

        if (!client.emailVerified) {
          throw emailNotVerified();
        }

        return Client.app.models.VerificationToken.findOne({
          where: {
            id: code,
            userid: client.id
          }
        })
          .then(verificationToken => {
            if (!verificationToken) {
              throw invalidVerificationToken(code);
            }

            return verificationToken.validate({scope: 'password_reset'})
              .then(isValid => {
                if (!isValid) {
                  throw invalidVerificationToken(code);
                }

                return client.setPassword(newPassword);
              })
              .then(() => {
                return verificationToken.delete();
              });
          });
      })
      .catch(next);
  };

  Client.remoteMethod(
    'passwordUpdate',
    {
      description: 'Update client password using verification code.',
      accepts: [
        {arg: 'email', type: 'string', required: true},
        {arg: 'code', type: 'string', required: true},
        {arg: 'newPassword', type: 'string', required: true},
      ],
      http: {verb: 'post', path: '/password-update'},
    }
  );
};
