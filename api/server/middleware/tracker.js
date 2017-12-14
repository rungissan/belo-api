'use strict';

const debug = require('debug')('spiti:middleware:tracker');

module.exports = function() {
  return function tracker(req, res, next) {
    debug('Request tracking middleware triggered on %s', req.url);
    var start = process.hrtime();
    res.once('finish', function() {
      var diff = process.hrtime(start);
      var ms = diff[0] * 1e3 + diff[1] * 1e-6;
      debug('The request processing time is %d ms.', ms);
    });
    next();
  };
};
