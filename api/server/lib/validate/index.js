'use strict';

import Promise from 'bluebird';

import ajv from './jsonValidator';

export default function validate(data, schema) {
  let validate = ajv.compile(schema);

  if (!validate(data)) {
    let err = new Error('validation_error');
    err.status = 422;
    err.type = 'json-schema';

    return Promise.reject(err);
  }

  return Promise.resolve(data);
};
