'use strict';

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * @desc Rreturns random string.
 * @param {Integer} [length]
 * @param {String} [alphabet]
 * @returns {String}
 */
export function randomString(length = 6, alphabet = ALPHABET) {
  const aLength = alphabet.length;
  let str = '';
  for (var i = 0; i < length; i++) {
    str += alphabet.charAt(Math.floor(Math.random() * aLength));
  }
  return str;
}
