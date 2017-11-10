exports.merge = require('utils-merge');
exports.uid = require('uid2');

function generateToken(options) {
  options = options || {};
  var id = exports.uid(32);
  if (options.client && options.client.tokenType === 'jwt') {
    var secret = options.client.clientSecret || options.client.restApiKey;
    var payload = {
      id: id,
      clientId: options.client.id,
      userId: options.user && options.user.id,
      scope: options.scope,
      createdAt: new Date(),
    };
    var token = helpers.generateJWT(payload, secret, 'HS256');
    return {
      id: token,
    };
  } else if (options.client && options.client.tokenType === 'mac') {
    options.jwtAlgorithm = 'HS256'; // HS256 for mac token
    return macTokenGenerator.generateToken(options);
  } else {
    return {
      id: id,
    };
  }
};

exports.generateToken = generateToken;
