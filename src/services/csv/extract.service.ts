import { getBodyForImport } from '../../utils/helpers';
import { readFile, readFileStream, writeFile } from '../../utils/io';
import { createLogger, logError, failLogger, logInfo, succeedLogger, logData, updateLogger } from '../../utils/logging';

interface Props {
  filePath?: string;
  columns: string;
  pToExtract?: string;
  pToInsert?: string;
  outputFile: string;
  outputType?: 'CSV' | 'JSON';
  valueToInsert?: string;
  transformer?: (data: any) => void;
}

const extractService = async ({
  filePath,
  columns,
  pToExtract,
  pToInsert,
  valueToInsert,
  outputFile,
  outputType,
  transformer = getBodyForImport,
}: Props) => {
  const _LOGGER_NAME = 'SP_ES';
  const loggerInstance = createLogger({ name: _LOGGER_NAME, options: { text: 'Running extractService...' } });

  try {
    if (!filePath) throw new Error();

    // Read Stage //
    updateLogger({
      name: _LOGGER_NAME,
      instance: loggerInstance,
      options: { text: 'Reading file in extractService...' },
    });
    // spinnies.update('SP_ES');
    const data = await readFile({ filePath, parser: outputType, loggerInstance });

    // Transform Stage //
    updateLogger({
      name: _LOGGER_NAME,
      instance: loggerInstance,
      options: { text: 'Processing data from file in extractService...' },
    });
    // spinnies.update('SP_ES', { text: 'Processing data from file in extractService...' });
    const content = transformer({ data, pToExtract, columns });

    updateLogger({
      name: _LOGGER_NAME,
      instance: loggerInstance,
      options: { text: 'Writing file to disk in extractService...' },
    });
    // spinnies.update('SP_ES', { text: 'Writing file to disk in extractService...' });
    writeFile({
      filePath: outputFile,
      parser: outputType,
      columns: ['data', ...columns.split(',')],
      content,
    });
  } catch (error) {
    failLogger({
      name: _LOGGER_NAME,
      instance: loggerInstance,
      options: { text: 'FAILED to execute extractService...' },
    });
    // spinnies.fail('SP_ES', { text: 'FAILED to execute extractService...' });
    console.error(error);
    // ERROR({
    //   serviceName: 'extractService',
    //   error,
    //   message: 'ERROR while Running Extract CSV Service',
    // });
  } finally {
    succeedLogger({
      name: _LOGGER_NAME,
      instance: loggerInstance,
      options: { text: 'logData executing extractService...' },
    });
    // spinnies.succeeded('SP_ES', { text: 'logData executing extractService...' });
    // logData({
    //   serviceName: 'extractService',
    //   data: {
    //     filePath: outputFile,
    //   },
    //   message: `logDatafully Ran Extract Service. Output file is ${outputFile}`,
    // });
  }
};

export { extractService };
