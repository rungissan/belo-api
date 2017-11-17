'use strict';

import path    from 'path';
import Promise from 'bluebird';
import {
  errUserNotFound,
  errInvalidVerificationToken,
  errEmailNotFound,
  errEmailNotVerified,
  errUnsupportedRole,
  errUserAlreadyHaveRole
} from '../lib/errors';

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
        verifyOptions.from = 'spiti.social.testing@gmail.com';

        var template = Client.app.loopback.template(verifyOptions.template);
        var body = template(verifyOptions);

        const Email = verifyOptions.mailer;
        return Email.send(verifyOptions);
      });
  };

  Client.afterRemote('create', function(context, client, next) {
    client.account.create({})
      .then(account => {
        if (!Client.settings.emailVerificationRequired) {
          return next();
        }

        let options = {
          type: 'email',
          to: client.email,
          from: 'test@domain.com',
          subject: 'Thanks for registering.',
          template: path.resolve(__dirname, '../../server/views/verify.ejs'),
          user: client
        };

        return client.verifyEmail(options)
          .then(() => {
            return next();
          });
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
          throw errUserNotFound(userId);
        }

        return Client.app.models.VerificationToken.findOne({
          where: {
            id: code,
            userid: userId
          }
        })
          .then(verificationToken => {
            if (!verificationToken) {
              throw errInvalidVerificationToken(code);
            }

            return verificationToken.validate({scope: 'email_verification'})
              .then(isValid => {
                if (!isValid) {
                  throw errInvalidVerificationToken(code);
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
          throw errEmailNotFound();
        }

        if (!client.emailVerified && Client.settings.emailVerificationRequired) {
          throw errEmailNotVerified();
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
          from: 'spiti.social.testing@gmail.com',
          subject: 'Password reset.',
          template: path.resolve(__dirname, '../../server/views/password-reset.ejs')
        };

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
      http: {verb: 'post', path: '/password-reset'}
    }
  );

  Client.passwordUpdate = function(email, code, newPassword, next) {
    return new Promise((resolve, reject) => {
      return resolve(Client.validatePassword(newPassword));
    })
      .then(() => {
        return Client.findOne({where: {email}});
      })
      .then(client => {
        if (!client) {
          throw errEmailNotFound();
        }

        if (!client.emailVerified) {
          throw errEmailNotVerified();
        }

        return Client.app.models.VerificationToken.findOne({
          where: {
            id: code,
            userid: client.id
          }
        })
          .then(verificationToken => {
            if (!verificationToken) {
              throw errInvalidVerificationToken(code);
            }

            return verificationToken.validate({scope: 'password_reset'})
              .then(isValid => {
                if (!isValid) {
                  throw errInvalidVerificationToken(code);
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
        {arg: 'newPassword', type: 'string', required: true}
      ],
      http: {verb: 'post', path: '/password-update'}
    }
  );

  Client.remoteMethod(
    'passwordUpdate',
    {
      description: 'Update client password using verification code.',
      accepts: [
        {arg: 'email', type: 'string', required: true},
        {arg: 'code', type: 'string', required: true},
        {arg: 'newPassword', type: 'string', required: true}
      ],
      http: {verb: 'post', path: '/password-update'}
    }
  );

  async function setRole(client, roleName) {
    let Role        = Client.app.models.Role;
    let RoleMapping = Client.app.models.RoleMapping;

    let roleMappings = await RoleMapping.count({
      principalType: 'USER',
      principalId: client.id
    });
    if (roleMappings > 0) {
      throw errUserAlreadyHaveRole();
    }

    let clientRole = await Role.findOne({
      where: { name: roleName }
    });
    if (!clientRole) {
      throw errUnsupportedRole(roleName);
    }

    await Client.app.dataSources.postgres.transaction(async models => {
      const { RoleMapping, Account } = models;

      await RoleMapping.create({
        roleId: clientRole.id,
        principalType: RoleMapping.USER,
        principalId: client.id
      });
      await Account.updateAll({userid: client.id}, {type: roleName});
    });

    return client;
  }

  Client.prototype.setRole = async function(role) {
    if (!['user', 'prof'].includes(role)) {
      throw errUnsupportedRole(role);
    }

    return await setRole(this, role);
  };

  Client.remoteMethod(
    'prototype.setRole',
    {
      description: 'Set user role.',
      accepts: [
        {arg: 'role', type: 'string', required: true}
      ],
      returns: { arg: 'data', type: 'Client', root: true},
      http: {verb: 'post', path: '/role'}
    }
  );
};
