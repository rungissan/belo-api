'use strict';

import crypto from 'crypto';

/**
 * @desc Rreturns random string.
 * @param {Integer} length
 * @param {String} format
 * @returns {String}
 */
export function randomString(length = 8, format = 'hex') {
  return crypto.randomBytes(length).toString(format);
};
