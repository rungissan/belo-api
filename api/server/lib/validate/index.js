'use strict';

import Promise from 'bluebird';
const debug = require('debug')('spiti:validations');

import ajv, { getSchema, formatErrors } from './jsonValidator';

export default function validate(data, modelName, schemaName) {
  let schema = getSchema(`${modelName}/${schemaName}`);

  return validateBySchema(data, schema, modelName);
};

export function validateBySchema(data, schema, modelName = '') {
  let validate = ajv.compile(schema);

  if (!validate(data)) {
    debug('Reject validation with errors:', validate.errors);
    return Promise.reject(formatErrors(validate.errors, modelName));
  }

  debug('Validated successfully');
  return Promise.resolve(data);
};
