'use strict';

import Promise from 'bluebird';
const debug = require('debug')('spiti:validations');

import ajv, { getSchema, formatErrors } from './jsonValidator';

export default function validate(data, modelName, schemaName) {
  let schema = getSchema(`${modelName}/${schemaName}`);
  let validate = ajv.compile(schema);

  if (!validate(data)) {
    debug('Reject validation with errors:', validate.errors);
    return Promise.reject(formatErrors(validate.errors, modelName));
  }

  debug('Validated successfully');
  return Promise.resolve(data);
};
