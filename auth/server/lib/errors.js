'use strict';

export const errEmailNotVerified = () => {
  let error = new Error('Email not verified');
  error.statusCode = 400;
  error.code = 'EMAIL_NOT_VERIFIED';

  return error;
};
