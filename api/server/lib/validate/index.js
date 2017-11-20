'use strict';

import Promise from 'bluebird';

import ajv, { getSchema, formatErrors } from './jsonValidator';

export default function validate(data, modelName, schemaName) {
  let schema = getSchema(`${modelName}/${schemaName}`);
  let validate = ajv.compile(schema);

  if (!validate(data)) {
    return Promise.reject(formatErrors(validate.errors, modelName));
  }

  return Promise.resolve(data);
};
