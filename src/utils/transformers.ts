import { logDebug, logInfo } from './logging';
import fs from 'fs';
import csvParser from 'csv-parser';

interface Props {
  data: any;
  columns: string;
  pToExtract: string;
  pToInsert: string;
  valueToInsert: string;
  debug?: boolean;
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
export const parseCVS = (
  filePath: string,
  identifier: string,
): Promise<Record<string, unknown>> => {
  let result = {};
  let resultLength = Object.keys(result).length;
  const stream = fs
    .createReadStream(filePath)
    .pipe(csvParser({ mapHeaders: ({ header }) => header.trim() }));

  return new Promise((resolve, reject) => {
    stream
      .on('data', chunk => {
        if (chunk[identifier]) {
          result[chunk[identifier]] = chunk;
          // logInfo({
          //   serviceName: 'parseCVS',
          //   data: {
          //     [chunk[identifier]]: chunk,
          //   },
          //   message: `Found the identifier in the row... Adding it to the result obj, the length is ${resultLength++}`,
          // });
        }
      })
      .on('end', () => {
        // logInfo({
        //   serviceName: 'parseCVS',
        //   data: {
        //     filePath,
        //     contentLength: Object.keys(result).length,
        //   },
        //   message: 'Succesfully Read the file',
        // });

        return resolve(result);
      })
      .on('error', error => {
        // logError({
        //   serviceName: 'parseCVS',
        //   error,
        //   message: 'FAILURE while Reading the File',
        // });
        return reject(error);
      });
  });
};

// TODO
export const readCSV = (filePath: string, loggerInstance?: any) => {
  let result: any[] = [];
  // let resultLength = Object.keys(result).length;
  const stream = fs
    .createReadStream(filePath)
    .pipe(csvParser({ mapHeaders: ({ header }) => header.trim() }));

  return new Promise((resolve, reject) => {
    stream
      .on('data', chunk => {
        // resultLength++;
        result.push(chunk);
      })
      .on('end', () => {
        return resolve(result);
      })
      .on('error', error => {
        return reject(error);
      });
  });
};

// *
export const extractNestedData = ({ data, pToExtract, columns, debug }: Props) => {
  let result = [];

  const pathToExtractProperty = pToExtract.split('.');
  const columnsToKeep = columns.split(',');
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
