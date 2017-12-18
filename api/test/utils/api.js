'use strict';

export function apiWithAuth(api, appClient, options = {}) {
  let isJson = options.isJson || (typeof options.isJson === 'undefined');

  return function apiCall(method, url, token) {
    if (!token) {
      if (typeof url === 'object') {
        token = url;
        url = method;
        method = 'get';
      } else {
        throw new Error('token required');
      }
    }

    let call = api[method](url).auth(appClient.id, appClient.clientSecret)
      .set('Authorization', 'bearer ' + token.id);

    if (isJson) {
      call.expect('Content-Type', /json/);
    }

    return call;
  };
}
