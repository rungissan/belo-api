'use strict';

import helpers           from './oauth2-helper';
import utils             from './utils';
import MacTokenGenerator from './mac-token';

const macTokenGenerator = new MacTokenGenerator('sha256');

export function createAccessToken(options) {
  options = options || {};
  var id = utils.uid(32);
  if (options.client && options.client.tokenType === 'jwt') {
    var secret = options.client.clientSecret || options.client.restApiKey;
    var payload = {
      id: id,
      clientId: options.client.id,
      userId: options.user && options.user.id,
      scope: options.scope,
      createdAt: new Date()
    };
    var token = helpers.generateJWT(payload, secret, 'HS256');
    return {
      id: token
    };
  } else if (options.client && options.client.tokenType === 'mac') {
    options.jwtAlgorithm = 'HS256'; // HS256 for mac token
    return macTokenGenerator.generateToken(options);
  } else {
    return {
      id: id
    };
  }
};

export async function genereateTokensForClient(app, options) {
  let { user, clientId, scope } = options;
  let OAuthClientApplication  = app.models.OAuthClientApplication;
  let OAuthAccessToken        = app.models.OAuthAccessToken;

  let clientApp = await OAuthClientApplication.findById(clientId);

  if (!clientApp) {
    throw new Error('Client application not found');
  }

  let token = createAccessToken({
    grant: 'Resource Owner Password Credentials',
    client: clientApp,
    user: user,
    scope: scope || ['DEFAULT']
  });

  let refreshToken = createAccessToken({
    grant: 'Resource Owner Password Credentials',
    client: user,
    user: clientApp,
    scope: scope || ['DEFAULT'],
    refreshToken: true
  }).id;

  let ttl = 360000;
  let tokenObj = {
    id: token.id,
    appId: clientApp.id,
    userId: user.id,
    scopes:  scope || ['DEFAULT'],
    issuedAt: new Date(),
    expiresIn: ttl,
    tokenType: 'Bearer',
    refreshToken: refreshToken
  };

  tokenObj.expiresIn = ttl;
  tokenObj.issuedAt = new Date();
  tokenObj.expiredAt = new Date(tokenObj.issuedAt.getTime() + ttl * 1000);

  let accessToken = await OAuthAccessToken.create(tokenObj);
  return accessToken;
}
