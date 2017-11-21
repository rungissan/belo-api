'use strict';

module.exports = function customErrHCreator() {
  return function customErrHandler(err, req, res, next) {
    err = buildError(err);
    next(err);
  };
};

function buildError(err) {
  if (!err.message) {
    err.message = err.error;
  }

  return err;
};
