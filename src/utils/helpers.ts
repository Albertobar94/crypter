import { logInfo } from './logging';

export const date = () => {
  const year = new Date().getFullYear();
  const month = new Date().getMonth();
  const day = new Date().getDate();
  return `${day}-${month}-${year}`;
};

export const parseTuple = (arr: string[]): string => {
  return `${arr}`;
};

export const updateURL = ({ value, baseUrl, request }) => {
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

  return _INJECTED_VALUE
    ? _INJECTED_VALUE === 'userId' || 'orderId'
      ? _ID_I_V
      : _EMAIL_I_V
    : _BASE_URL;
};
