import csvParser from 'csv-parser';
import fs from 'fs';
import { Parser } from 'json2csv';
import { logError, logInfo } from './logging';

interface Props {
  data: any;
  columns: string;
  pToExtract: string;
  pToInsert: string;
  valueToInsert: string;
}

export const date = () => {
  const year = new Date().getFullYear();
  const month = new Date().getMonth();
  const day = new Date().getDate();
  return `${day}-${month}-${year}`;
};

export const parseTuple = (arr: string[]): string => {
  return `${arr}`;
};

export const normalizeData = ({ columns, arr, identifier }) => {
  const one = columns.map(column => {
    logInfo({
      serviceName: 'normalizeData',
      message: `PROCESSING column ${column} with a value of ${
        arr[0][identifier][column] || arr[1][identifier][column]
      } in identifier ${identifier}`,
    });
    return {
      [column]: arr[0][identifier][column] || arr[1][identifier][column],
    };
  });

  const data = Object.assign({}, ...one);
  return data;
};

export const parseCVS = (filePath: string, identifier: string): Promise<Record<string, unknown>> => {
  let result = {};
  let resultLength = Object.keys(result).length;
  const stream = fs.createReadStream(filePath).pipe(csvParser({ mapHeaders: ({ header }) => header.trim() }));

  return new Promise((resolve, reject) => {
    stream
      .on('data', chunk => {
        if (chunk[identifier]) {
          result[chunk[identifier]] = chunk;
          logInfo({
            serviceName: 'parseCVS',
            data: {
              [chunk[identifier]]: chunk,
            },
            message: `Found the identifier in the row... Adding it to the result obj, the length is ${resultLength++}`,
          });
        }
      })
      .on('end', () => {
        logInfo({
          serviceName: 'parseCVS',
          data: {
            filePath,
            contentLength: Object.keys(result).length,
          },
          message: 'Succesfully Read the file',
        });

        return resolve(result);
      })
      .on('error', error => {
        logError({
          serviceName: 'parseCVS',
          error,
          message: 'FAILURE while Reading the File',
        });
        return reject(error);
      });
  });
};

export const readCSV = (filePath: string, loggerInstance: any) => {
  let result: any[] = [];
  let resultLength = Object.keys(result).length;
  const stream = fs.createReadStream(filePath).pipe(csvParser({ mapHeaders: ({ header }) => header.trim() }));

  return new Promise((resolve, reject) => {
    stream
      .on('data', chunk => {
        resultLength++;
        result.push(chunk);
      })
      .on('end', () => {
        if (loggerInstance) {
          loggerInstance.succeed('SP_R', {
            text: `logDatafully processed ${resultLength} records from ${filePath}`,
            logDataColor: 'greenBright',
          });
        }
        return resolve(result);
      })
      .on('error', error => {
        return reject(error);
      });
  });
};

export const getBodyForImport = ({ data, pToExtract, columns }: Props) => {
  let result = [];

  const pathToExtractProperty = pToExtract.split('.');
  const columnsToKeep = columns.split(',');
  try {
    result = data.map(chunk => {
      logInfo({
        serviceName: 'getBodyForImport',
        data: chunk,
        message: 'Mapping through data',
      });
      const extractedProperty = pathToExtractProperty.reduce((accum: any[], key, i) => {
        if (i === 0) {
          // INFO({
          //   serviceName: 'getBodyForImport',
          //   data: JSON.parse(chunk[key]),
          //   message: `Transforming data at index ${i}`,
          // });
          try {
            const row = JSON.parse(chunk[key]);
            accum = [row];
            return accum;
          } catch (error) {
            console.error(error);
          }
        }
        logInfo({
          serviceName: 'getBodyForImport',
          data: accum?.[0]?.[key],
          message: `Transforming data at index ${i}`,
        });
        accum = [accum[0][key]];
        return accum;
      }, []);

      const columns = columnsToKeep.map(key => {
        if (key in chunk) {
          logInfo({
            serviceName: 'getBodyForImport',
            data: chunk[key],
            message: 'getting columns...',
          });
          return {
            [key]: chunk[key],
          };
        }
      });

      return Object.assign({}, ...columns, { data: Object.assign({}, ...extractedProperty) });
    });

    return result;
  } catch (error) {
    console.error(error);
  }
};

export const transformRecordForUserImport = record => {
  let data = JSON.parse(record.data);
  let { preferences, addresses, user } = data;

  addresses = addresses?.map(address => {
    const addressInfo = address;
    if (addressInfo.postcode && addressInfo.postcode.length) {
      addressInfo.postCode = addressInfo.postcode;
      delete addressInfo.postcode;
    }
    delete addressInfo.name;
    return addressInfo;
  });

  preferences = preferences?.map(preference => {
    const { isMandatory } = preference;
    preference.isMandatory = isMandatory === 'true' ? true : false;
    return preference;
  });

  user.authenticationAgents = user.authenticationAgents.map(authenticationAgent => {
    if (authenticationAgent.name !== 'Default') {
      authenticationAgent.customInfo = authenticationAgent.customInfo.map(info => {
        delete info.mandatory;
        return info;
      });
      return authenticationAgent;
    }
    return authenticationAgent;
  });

  user.userId = record.userId;
  user.accounts[0].accountId = record.accountId;

  logInfo({
    serviceName: 'transformRecordForUserImport',
    message: `Parsed Record with id of ${user.userId}`,
    data: {
      user,
      addresses,
      preferences,
    },
  });

  return {
    data: {
      user,
      addresses,
      preferences,
    },
  };
};

export const exportReport = async (results, EXPORT_PATH) => {
  console.log(`${EXPORT_PATH} ---> ${results.length}`);
  if (results.length) {
    // @ts-expect-error
    const parser = new Parser(Object.keys(results[0]));
    const csv = parser.parse(results);
    try {
      fs.writeFileSync(EXPORT_PATH, csv);
    } catch (error) {
      console.log(error);
      fs.writeFileSync(EXPORT_PATH.split('/').pop(), csv);
    }
  }
};

export const updateURL = ({ value, baseUrl, request }) => {
  const _BASE_URL = baseUrl;
  const _REQUEST = request;
  const _INJECTED_VALUE = value;

  const _ID_I_V =
    (_INJECTED_VALUE && _INJECTED_VALUE === 'userId') || (_INJECTED_VALUE && _INJECTED_VALUE === 'orderId')
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

  return _INJECTED_VALUE ? (_INJECTED_VALUE === 'userId' || 'orderId' ? _ID_I_V : _EMAIL_I_V) : _BASE_URL;
};
