import got from 'got/dist/source';
import cliProgress from 'cli-progress';

import { updateURL } from '../common/helpers';
import { logError, logInfo, logData, logDebug, createLogger } from './logging';
import { halt } from './bootstrap';

interface Props {
  data: any[];
  concurrency?: number;
  pauseTime?: number;
  intervalTime?: number;
  url: string;
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  headers?: {};
  logDataCallback: (props: any, req?: any) => Promise<any>;
  errorsCallback: (props: any, req?: any) => Promise<any>;
  injectValue: string;
  logDataOutput?: string;
  errorsOutput?: string;
  outTransformer?: any;
  loggerInstance?: any;
  debug: boolean;
}

const doSequencialRequest = async ({
  data,
  intervalTime = 2.5,
  concurrency = 2000,
  pauseTime = 1000,
  url,
  method = 'GET',
  headers = {},
  injectValue,
  logDataCallback,
  errorsCallback,
  loggerInstance = createLogger(),
  debug = false,
}: Props): Promise<any> => {
  const _DATA_LENGTH = data.length;
  const _DATA = data;
  const _CONCURRENCY = concurrency;
  const _PAUSE_TIME = pauseTime;
  const _INTERVAL_TIME = intervalTime;
  const _HALT_TIME = 1000;
  let _BASE_URL = url;
  let _REQUEST_URL: string;
  const _METHOD = method;
  const _HEADERS = headers;
  let _COUNTER = 0;
  let _TOTAL_COUNT = 0;
  let _REQ_PROCESSED = 0;
  const _logData: any[] = [];
  const _ERRORS: any[] = [];
  let _GOT_REQUEST: any = {};
  const _halt = halt;

  // Logger //
  loggerInstance.add('SP_SR', { text: `Running Sequential Requests...` });
  const b1 = new cliProgress.SingleBar({
    format: 'Processing Requests >> {value} of {total}',
    stopOnComplete: true,
  });
  b1.start(_DATA.length, _TOTAL_COUNT);

  for await (let _REQUEST of _DATA) {
    // Reset //
    if (_COUNTER === _CONCURRENCY) {
      if (debug) {
        logDebug({
          serviceName: 'doSequencialRequest',
          message: `${_TOTAL_COUNT} requests so far, finished batch size of ${_COUNTER} going to hault...`,
        });
      }

      _COUNTER = 0;
      loggerInstance.update('SP_SR', {
        text: `${_TOTAL_COUNT} Requests so far... Pausing for ${_PAUSE_TIME}ms...`,
      });
      await _halt(_PAUSE_TIME);
      loggerInstance.update('SP_SR', { text: `Running Sequential Requests...` });
    }

    // Request //
    _REQUEST_URL = updateURL({ value: injectValue, request: _REQUEST, baseUrl: _BASE_URL, debug });

    _COUNTER++;
    _TOTAL_COUNT++;
    b1.update(_REQ_PROCESSED);
    await _halt(_INTERVAL_TIME);

    _GOT_REQUEST =
      // TODO quitar esto.. es muy especifico
      _METHOD !== 'GET' && _METHOD !== 'DELETE'
        ? {
            url: _REQUEST_URL,
            method: _METHOD,
            headers: _HEADERS,
            json: {
              data: {
                order: {
                  userId: _REQUEST.oldUserId,
                  accountId: _REQUEST.oldAccountId,
                },
              },
            },
            responseType: 'json',
          }
        : {
            url: _REQUEST_URL,
            method: _METHOD,
            headers: _HEADERS,
            responseType: 'json',
          };

    if (debug) {
      logDebug({
        serviceName: 'doSequencialRequest',
        message: `REQUEST -> Url ${_REQUEST_URL}, Method ${_METHOD}, request ${_COUNTER} of batch and ${_TOTAL_COUNT} of total`,
        data: _REQUEST,
      });
    }
    got(_GOT_REQUEST)
      .then(async result => {
        if (debug) {
          logDebug({
            serviceName: 'doSequencialRequest',
            message: 'Received logDataful Response',
            data: result?.body as any,
          });
        }

        _REQ_PROCESSED++;
        const data = await logDataCallback(result, _REQUEST);
        _logData.push(data);
      })
      .catch(async error => {
        if (debug) {
          logError({
            serviceName: 'doSequencialRequest',
            message: `ERROR ${error?.response?.statusCode || error?.code} Response from ${
              _REQUEST[injectValue]
            }`,
            error: error?.response?.body === '' ? null : error?.response?.body,
          });
        }
        _REQ_PROCESSED++;
        const data = await errorsCallback(error, _REQUEST);
        data[injectValue] = _REQUEST[injectValue];
        _ERRORS.push(data);
      });
  }

  while (_REQ_PROCESSED < _DATA_LENGTH) {
    if (_TOTAL_COUNT === _DATA_LENGTH) {
      await _halt(10000);
      break;
    }
    await _halt(_HALT_TIME);
  }

  loggerInstance.succeed('SP_SR', { text: `logDatafully Processed ${_DATA_LENGTH} Requests...` });

  return {
    logData: _logData,
    errors: _ERRORS,
  };
};

export { doSequencialRequest };
