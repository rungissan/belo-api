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

/**
 * @desc Accept sql string and replacement values as object, returns formatted sql with replacements array.
 * @param {String} sql
 * @param {Object} values
 * @returns {Object}
 * @property {String} sql
 * @property {Array} replacements
 */
export function formatSQLReplacements(sql, values = {}) {
  let replacements = [];
  let i = 0;

  sql = sql.replace(/\:+(?!\d)(\w+)/g, (value, key) => {
    if ('::' === value.slice(0, 2)) {
      return value;
    }

    if (values[key] !== undefined) {
      replacements.push(values[key]);
      i++;
      return '$' + i;
    } else {
      throw new Error(`Parameter ${value} not specified.`);
    }
  });

  return {
    sql,
    replacements
  };
}
