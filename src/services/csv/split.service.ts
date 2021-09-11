import CSV from 'csv-split-stream';
import fs from 'fs';
import { date } from '../../utils/helpers';
import { logError, logInfo, logData } from '../../utils/logging';

export const splitFile = async (
  filePath: string,
  lines = 100000,
  newFileName = 'new-split-file' + date(),
) => {
  if (!filePath) throw new Error('Bro, you need to add a filepath');

  let CSVResponse: any;

  logInfo({
    serviceName: 'splitFile',
    message: 'Executing Service',
    data: {
      filePath,
      lines,
      newFileName,
    },
  });

  try {
    CSVResponse = await CSV.split(
      fs.createReadStream(filePath),
      {
        lineLimit: lines,
      },
      (index: any) => fs.createWriteStream(`split-chunks/${newFileName}-${index + 1}.csv`),
    );
  } catch (error) {
    logInfo({
      serviceName: 'splitFile',
      message: 'FAILURE while splitting file',
      error,
    });
  } finally {
    logData({
      serviceName: 'splitFile',
      message: 'csvSplitStream succeeded',
      data: CSVResponse,
    });
  }
};
