import { logDebug, logError, logInfo } from './logging';
import fs from 'fs';
import csvParser from 'csv-parser';

interface Props {
  data?: any;
  columns?: string;
  pToExtract?: string;
  pToInsert?: string;
  valueToInsert?: string;
  debug?: boolean;
  file?: string;
  matchingValue?: string;
}

// *
export const normalizeData = ({ columns, arr, matchingValue, debug }) => {
  const one = columns.map(column => {
    if (debug) {
      logInfo({
        serviceName: 'normalizeData',
        message: `PROCESSING column ${column} with a value of ${
          arr[0][matchingValue][column] || arr[1][matchingValue][column]
        } in matchingValue ${matchingValue}`,
      });
    }
    return {
      [column]: arr[0][matchingValue][column] || arr[1][matchingValue][column],
    };
  });

  const data = Object.assign({}, ...one);
  return data;
};

// TODO
export const readCsvStream = ({
  file,
  matchingValue,
  debug,
}: Props): Promise<Record<string, unknown>> => {
  let objResult = {};
  let arrResult: any[] = [];
  let objResultLength = Object.keys(objResult).length;
  let arrResultLength = arrResult.length;
  const stream = fs
    .createReadStream(file!)
    .pipe(csvParser({ mapHeaders: ({ header }) => header.trim() }));

  return new Promise((resolve, reject) => {
    stream
      .on('data', chunk => {
        if (matchingValue && chunk[matchingValue]) {
          if (debug) {
            logDebug({
              data: {
                [chunk[matchingValue]]: chunk,
              },
              message: `Matched value in objResult, the length is: ${objResultLength++}`,
            });
          }
          objResult[chunk[matchingValue]] = chunk;
        }
        if (!matchingValue) {
          if (debug) {
            logDebug({
              data: chunk,
              message: `Matched value in arrResult, the length is: ${arrResultLength++}`,
            });
          }
          arrResult.push(chunk);
        }
      })
      .on('end', () => {
        if (debug) {
          logDebug({
            data: file,
            message: `Processed the file, the length is: ${arrResultLength++}`,
          });
        }
        // TODO addd spinner
        const result = Object.keys(objResult).length > 1 ? objResult : arrResult;
        return resolve(result);
      })
      .on('error', error => {
        // TODO addd spinner
        logError({
          message: `FAILED to read file ${file}`,
        });
        console.error(error);
        return reject(error);
      });
  });
};

// *
export const extractNestedData = ({ data, pToExtract, columns, debug }: Props) => {
  let result = [];

  const pathToExtractProperty = pToExtract!.split('.');
  const columnsToKeep = columns!.split(',');
  try {
    result = data.map(chunk => {
      if (debug) {
        logDebug({
          data: chunk,
          message: 'Extracting data...',
        });
      }
      const extractedProperty = pathToExtractProperty.reduce((accum: any[], key, i) => {
        if (i === 0) {
          if (debug) {
            logDebug({
              data: JSON.parse(chunk[key]),
              message: `Transforming data at index ${i}`,
            });
          }
          try {
            const row = JSON.parse(chunk[key]);
            accum = [row];
            return accum;
          } catch (error) {
            throw error;
          }
        }
        if (Array.isArray(accum[0]) && typeof Number(key) === 'number') {
          accum = [accum[0][0]];
          if (debug) {
            logDebug({
              data: accum,
              message: `Transforming data form an Array at index ${i}`,
            });
          }
          return accum;
        }

        accum = [accum[0][key]];
        if (debug) {
          logDebug({
            data: accum,
            message: `Transforming data from an object at index ${i}`,
          });
        }
        return accum;
      }, []);

      const columns = columnsToKeep.map(key => {
        if (key in chunk) {
          if (debug) {
            logDebug({
              data: chunk[key],
              message: 'getting columns...',
            });
          }
          return {
            [key]: chunk[key],
          };
        }
      });
      const dataFlattened = Array.isArray(extractedProperty)
        ? Object.assign(
            {},
            { [pathToExtractProperty[pathToExtractProperty.length - 1]]: extractedProperty[0] },
          )
        : Object.assign({}, extractedProperty);
      if (debug) {
        logDebug({
          data: { dataFlattened, extractedProperty },
          message: 'getting data flattend...',
        });
      }

      return Object.assign({}, ...columns, {
        [pathToExtractProperty[0]]: Object.assign({}, dataFlattened),
      });
    });

    return result;
  } catch (error) {
    throw error;
  }
};

// TODO
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
