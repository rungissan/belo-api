'use strict';

import fs   from 'fs';
import path from 'path';
import Ajv  from 'ajv';

import { errAjvValidation } from '../errors';

const AJV_OPTIONS = {
  removeAdditional: true,
  coerceTypes: true,
  useDefaults: true,
  allErrors: true,
  errorDataPath: 'property',
  jsonPointers: true // ajv-errors required
};
const ajv = new Ajv(AJV_OPTIONS);

const commonSchemas = [];

// precompile common schemas if need
commonSchemas.forEach(commonSchema => {
  let schema = getSchema(commonSchema.schemaName);
  ajv.compile(schema);
});

export default ajv;

export function getSchema(schemaName) {
  let schemaPath = `../../validations/${schemaName}.json`;
  if (fs.existsSync(path.join(__dirname, schemaPath))) {
    return require(schemaPath);
  } else {
    throw new Error(`schema(${schemaName}.json) validate not found`);
  }
};

export function formatErrors(errors = [], modelName = '') {
  let err = errAjvValidation();

  if (Array.isArray(errors)) {
    let codes = {};
    let messages = {};

    errors.forEach(e => {
      let path = e.dataPath.slice(1);
      if (e.keyword == 'type') {
        e.keyword = `${e.keyword}.${e.params.type}`;
      }

      codes[path] = [e.keyword];
      messages[path] = [e.message];
    });

    err.details = {
      context: modelName,
      codes,
      messages
    };
  };

  return err;
};
