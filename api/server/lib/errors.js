'use strict';

export const errUnauthorized = () => {
  let error = new Error();
  error.status = 401;
  error.message = 'Authorization Required';
  error.code = 'AUTHORIZATION_REQUIRED';

  return error;
};

export const errUserNotFound = (uid) => {
  let error = new Error(`User not found: ${uid}`);
  error.statusCode = 404;
  error.code = 'USER_NOT_FOUND';

  return error;
};

export const errEmailNotFound = () => {
  let error = new Error('This Email is unknown to the system');
  error.statusCode = 404;
  error.code = 'EMAIL_NOT_FOUND';

  return error;
};

export const errFeedNotFound = () => {
  let error = new Error('This Feed is unknown to the system');
  error.statusCode = 404;
  error.code = 'FEED_NOT_FOUND';

  return error;
};

export const errInvalidVerificationCode = (code) => {
  let error = new Error(`Invalid verification code: ${code}`);
  error.statusCode = 400;
  error.code = 'INVALID_CODE';

  return error;
};


export const errEmailNotVerified = () => {
  let error = new Error('Email not verified');
  error.statusCode = 400;
  error.code = 'EMAIL_NOT_VERIFIED';

  return error;
};

export const errInvalidVerificationToken = (token) => {
  let error = new Error(`Invalid verification code: ${token}`);
  error.statusCode = 400;
  error.code = 'INVALID_TOKEN';

  return error;
};

export const errUnsupportedRole = (roleName = '') => {
  let error = new Error(`Invalid role ${roleName}`);
  error.statusCode = 422;
  error.code = 'INVALID_ROLE';

  return error;
};

export const errUserAlreadyHaveRole = () => {
  let error = new Error('User already have role');
  error.statusCode = 422;
  error.code = 'INVALID_ROLE';

  return error;
};

export const errValidation = (message = 'Validation error') => {
  let error = new Error(message);
  error.statusCode = 422;
  error.code = 'VALIDATION_ERROR';

  return error;
};

export const errAjvValidation = (message = 'Validation error') => {
  let error = new Error(message);
  error.statusCode = 422;
  error.code = 'VALIDATION_ERROR';
  error.type = 'json-schema';

  return error;
};

export const errUnsupportedContainer = (containerName) => {
  let error = new Error(`Unsupported container ${containerName}`);
  error.statusCode = 422;
  error.code = 'VALIDATION_ERROR';

  return error;
};

export const errAccessDenied = (message = 'Access denied') => {
  let error = new Error(message);
  error.statusCode = 403;
  error.code = 'ACCESS_DENIED';

  return error;
};
