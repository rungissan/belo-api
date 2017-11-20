'use strict';

import fs   from 'fs';
import path from 'path';
import Ajv  from 'ajv';

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

commonSchemas.forEach(commonSchema => {
  let schema = getSchema(commonSchema.schemaName);
  ajv.compile(schema);
});

function getSchema(schemaName) {
  let schemaPath = `../schema/${schemaName}.json`;
  if (fs.existsSync(path.join(__dirname, schemaPath))) {
    return require(schemaPath);
  } else {
    throw new Error(`schema(${schemaName}.json) validate not found`);
  }
}

export default ajv;
