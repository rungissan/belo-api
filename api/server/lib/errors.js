'use strict';

export const unauthorized = () => {
  let error = new Error();
  error.status = 401;
  error.message = 'Authorization Required';
  error.code = 'AUTHORIZATION_REQUIRED';

  return error;
};

export const userNotFound = (uid) => {
  let error = new Error(`User not found: ${uid}`);
  error.statusCode = 404;
  error.code = 'USER_NOT_FOUND';

  return error;
};

export const emailNotFound = () => {
  let error = new Error('Email not found');
  error.statusCode = 404;
  error.code = 'EMAIL_NOT_FOUND';

  return error;
};

export const emailNotVerified = () => {
  let error = new Error('Email not verified');
  error.statusCode = 400;
  error.code = 'EMAIL_NOT_VERIFIED';

  return error;
};

export const invalidVerificationToken = (token) => {
  let error = new Error(`Invalid verification code: ${token}`);
  error.statusCode = 400;
  error.code = 'INVALID_TOKEN';

  return error;
};
