'use strict';

module.exports = function() {
  return function(err, req, res, next) {
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
