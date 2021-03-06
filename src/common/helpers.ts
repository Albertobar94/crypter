import { logDebug, logInfo } from '../utils/logging';
import { IncludesType } from './types';

export const date = (): string => {
  const year = new Date().getFullYear();
  const month = new Date().getMonth();
  const day = new Date().getDate();
  return `${day}-${month}-${year}`;
};

export const parseFlags = (arr: string[]): string => {
  return arr[0];
};

export const parseDescription = (arr: string[]): string => {
  return arr[1];
};

// TODO Refactor
export const updateURL = ({ value, baseUrl, request, debug }): string => {
  const _BASE_URL = baseUrl;
  const _REQUEST = request;
  const _INJECTED_VALUE = value;

  const _ID_I_V =
    (_INJECTED_VALUE && _INJECTED_VALUE === 'userId') ||
    (_INJECTED_VALUE && _INJECTED_VALUE === 'orderId')
      ? _BASE_URL
          .split('/')
          .map(e => {
            if (e[0] === ':') {
              if (!_REQUEST[_INJECTED_VALUE]) {
                logInfo({
                  serviceName: 'doSequencialRequest',
                  data: { _REQUEST, _INJECTED_VALUE },
                  message: '...',
                });
                throw new Error('Inject Value returns undefined or null');
              }
              return _REQUEST[_INJECTED_VALUE];
            }
            return e;
          })
          .join('/')
      : null;

  const _EMAIL_I_V =
    _INJECTED_VALUE && _INJECTED_VALUE === 'emailId'
      ? _BASE_URL
          .split('=')
          .map(e => {
            if (e[0] === ':') {
              if (!_REQUEST[_INJECTED_VALUE]) {
                logInfo({
                  serviceName: 'doSequencialRequest',
                  data: { _REQUEST, _INJECTED_VALUE },
                  message: '...',
                });
                throw new Error('Inject Value returns undefined or null');
              }
              return _REQUEST[_INJECTED_VALUE];
            }
            return e;
          })
          .join('=')
      : null;

  const result = _INJECTED_VALUE
    ? _INJECTED_VALUE === 'userId' || _INJECTED_VALUE === 'orderId'
      ? _ID_I_V
      : _EMAIL_I_V
    : _BASE_URL;

  if (debug) {
    logDebug({
      data: {
        result,
        value,
        baseUrl,
        request,
      },
      message: 'Updating URL',
    });
  }

  return result;
};

export const makeUserIdUrl = (userId: string, includes: IncludesType = 'none'): string => {
  if (includes && includes === 'all') {
    return `${
      process.env.USER_SERVICE_HOST
    }/v1/users/${userId.trim()}?includes=segments,organizations,addresses,preferences`;
  }
  if (includes && Array.isArray(includes)) {
    return `${process.env.USER_SERVICE_HOST}/v1/users/${userId.trim()}?includes=${includes.join(
      ',',
    )}`;
  }
  return `${process.env.USER_SERVICE_HOST}/v1/users/${userId.trim()}`;
};

export const makeSegmentsUrl = (): string => {
  return `${process.env.USER_SERVICE_HOST}/v1/segments`;
};

export const makeEmailIdUrl = (
  emailId: string,
  includes: IncludesType | Exclude<IncludesType, 'all' | 'none'>[] = 'none',
): string => {
  if (includes && includes == 'all') {
    return `${
      process.env.USER_SERVICE_HOST
    }/v1/users?emailId=${emailId.trim()}&includes=segments,organizations,addresses,preferences`;
  }
  if (includes && Array.isArray(includes)) {
    return `${
      process.env.USER_SERVICE_HOST
    }/v1/users?emailId=${emailId.trim()}&includes=${includes.join(',')}`;
  }
  return `${process.env.USER_SERVICE_HOST}/v1/users?emailId=${emailId.trim()}`;
};
