
'use strict';

import { randomString } from 'lib/util';

const DEFAULT_TOKEN_LEN = 6;

/**
 * Token for client verifications (email, reset password, etc.).
 *
 * **Default ACLs**
 *
 *  - DENY EVERYONE `*`
 *
 * @property {String} id Generated token ID.
 * @property {Number} ttl Time to live in seconds, 2 weeks by default.
 * @property {Date} created When the token was created.
 * @property {Object} settings Extends the `Model.settings` object.
 * @property {Number} settings.verificationTokenIdLength Length of the base64-encoded string verification token. Default value is 64.
 * Increase the length for a more secure verification token.
 *
 * @class VerificationToken
 * @inherits {PersistedModel}
 */

module.exports = function(VerificationToken) {
  /**
   * Create a cryptographically random verification token id.
   *
   * @callback {Function} callback
   * @param {Error} err
   * @param {String} token
   */

  VerificationToken.createVerificationTokenId = function(fn) {
    return Promise.resolve(randomString(6));
  };

  VerificationToken.observe('before save', function(ctx, next) {
    if (!ctx.instance || ctx.instance.id) {
      return next();
    }

    VerificationToken.createVerificationTokenId()
      .then(id => {
        ctx.instance.id = id;
        return next();
      })
      .catch(next);
  });
};
