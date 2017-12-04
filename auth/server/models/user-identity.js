'use strict';

import crypto from 'crypto';

function generateKey(hmacKey, algorithm, encoding) {
  algorithm = algorithm || 'sha1';
  encoding = encoding || 'hex';
  let hmac = crypto.createHmac(algorithm, hmacKey);
  let buf = crypto.randomBytes(32);
  hmac.update(buf);
  let key = hmac.digest(encoding);
  return key;
}

module.exports = function(UserIdentity) {
  /*!
  * Create an access token for the given user
  * @param {User} user The user instance
  * @param {Number} [ttl] The ttl in millisenconds
  * @callback {Function} cb The callback function
  * @param {Error|String} err The error object
  * param {AccessToken} The access token
  */
  function createAccessToken(user, ttl, cb) {
    if (arguments.length === 2 && typeof ttl === 'function') {
      cb = ttl;
      ttl = 0;
    }
    user.accessTokens.create({
      created: new Date(),
      ttl: Math.min(ttl || user.constructor.settings.ttl,
        user.constructor.settings.maxTTL)
    }, cb);
  }

  function profileToUser(provider, profile, options) {
    let profileEmail = profile.emails && profile.emails[0] &&
              profile.emails[0].value;
    // let generatedEmail = (profile.username || profile.id) + '@loopback.' +
    //           (profile.provider || provider) + '.com';
    // let email = provider === 'ldap' ? profileEmail : generatedEmail;
    let email = profile.emails && profile.emails[0] && profile.emails[0].value;

    let username = provider + '.' + (profile.username || profile.id);
    let password = generateKey('password');
    let userObj = {
      username: username,
      password: password
    };
    if (email) {
      userObj.email = email;
    }
    return userObj;
  }
  /**
  * Log in with a third-party provider such as Facebook or Google.
  *
  * @param {String} provider The provider name.
  * @param {String} authScheme The authentication scheme.
  * @param {Object} profile The profile.
  * @param {Object} credentials The credentials.
  * @param {Object} [options] The options.
  * @callback {Function} cb The callback function.
  * @param {Error|String} err The error object or string.
  * @param {Object} user The user object.
  * @param {Object} [info] The auth info object.
  *
  * -  identity: UserIdentity object
  * -  accessToken: AccessToken object
  */
  UserIdentity.login = function(provider, authScheme, profile, credentials, options, cb) {
    options = options || {};
    if (typeof options === 'function' && cb === undefined) {
      cb = options;
      options = {};
    }
    let autoLogin = options.autoLogin || options.autoLogin === undefined;

    profile.id = profile.id || profile.openid;
    UserIdentity.findOne({where: {
      provider: provider,
      externalId: profile.id
    }}, function(err, identity) {
      if (err) {
        return cb(err);
      }
      if (identity) {
        identity.credentials = credentials;
        return identity.updateAttributes({profile: profile,
          credentials: credentials, modified: new Date()}, function(err, i) {
          // Find the user for the given identity
          return identity.user(function(err, user) {
            // Create access token if the autoLogin flag is set to true
            if (!err && user && autoLogin) {
              return (options.createAccessToken || createAccessToken)(user, function(err, token) {
                identity.accessToken = token;
                cb(err, user, identity, token);
              });
            }
            cb(err, user, identity);
          });
        });
      }
      // Find the user model
      let userModel = (UserIdentity.relations.user &&
                       UserIdentity.relations.user.modelTo) ||
                       UserIdentity.app.loopback.getModelByType(UserIdentity.app.loopback.User);
      let userObj = (options.profileToUser || profileToUser)(provider, profile, options);
      if (!userObj.email && !options.emailOptional) {
        process.nextTick(function() {
          return cb('email is missing from the user profile');
        });
        return;
      }

      let query;
      if (userObj.email && userObj.username) {
        query = {or: [
          {username: userObj.username},
          {email: userObj.email}
        ]};
      } else if (userObj.email) {
        query = {email: userObj.email};
      } else {
        query = {username: userObj.username};
      }

      userModel.findOrCreate({where: query}, userObj, function(err, user) {
        if (err) {
          return cb(err);
        }
        let date = new Date();
        UserIdentity.findOrCreate({where: {externalId: profile.id}}, {
          provider: provider,
          externalId: profile.id,
          authScheme: authScheme,
          profile: profile,
          credentials: credentials,
          userId: user.id,
          created: date,
          modified: date
        }, function(err, identity) {
          if (!err && user && autoLogin) {
            return (options.createAccessToken || createAccessToken)(user, function(err, token) {
              identity.accessToken = token;
              cb(err, user, identity, token);
            });
          }

          cb(err, user, identity);
        });
      });
    });
  };
  return UserIdentity;
};
