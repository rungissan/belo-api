'use strict';

const unauthorized = () => {
  let error = new Error();
  error.status = 401;
  error.message = 'Authorization Required';
  error.code = 'AUTHORIZATION_REQUIRED';

  return error;
};

module.exports = {
  unauthorized
};
