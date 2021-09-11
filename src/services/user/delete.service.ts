import { doSequencialRequest } from '../../utils/requestSequencially';
import { exportReport } from '../../utils/helpers';
import { readFile } from '../../utils/io';
import { createLogger, failLogger, succeedLogger, updateLogger } from '../../utils/logging';

interface Props {
  filePath: string;
  fileFormat: 'CSV' | 'JSON';
  outputPath: string;
  debug: boolean;
}

const deleteUsers = async ({ filePath, fileFormat = 'CSV', outputPath, debug }: Props) => {
  let loggerInstance: any;
  let _LOGGER_NAME: string = 'DU_1';

  try {
    // Errors Stage //
    if (!filePath) throw new Error('File path must be given');
    if (!outputPath) throw new Error('Output path must be given');

    // Type of call //
    const _URL = `${process.env.USER_SERVICE_HOST}/v1/users/:userId`;

    // Vars stage //
    const _logData_EXPORT_PATH = `${outputPath}/logData.${fileFormat.toLocaleLowerCase()}`;
    const _ERRORS_EXPORT_PATH = `${outputPath}/errors.${fileFormat.toLocaleLowerCase()}`;

    // Logging //
    loggerInstance = createLogger({ name: _LOGGER_NAME, options: { text: 'Running validateUsers...' } });

    // Read stage //
    const data = await readFile({ filePath, parser: fileFormat, loggerInstance });

    const { logData, errors } = await doSequencialRequest({
      data,
      intervalTime: 3,
      concurrency: 2500,
      pauseTime: 2500,
      url: _URL,
      injectValue: 'userId',
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
        'x-tenant-id': process.env.FACL_TENANT_ID,
      },
      logDataCallback: async (res, req) => {
        const { data, body } = res;
        const transformer = {
          id: req.userId,
          statusCode: res?.statusCode || res?.code,
        };
        return transformer;
      },
      errorsCallback: async error => {
        const transformer = {
          statusCode: error?.response?.statusCode || error?.code,
        };

        return transformer;
      },
      loggerInstance,
      debug,
    });

    // Export Stage
    updateLogger({ instance: loggerInstance, name: _LOGGER_NAME, options: { text: 'Running exportReport...' } });
    await exportReport(logData, _logData_EXPORT_PATH);
    await exportReport(errors, _ERRORS_EXPORT_PATH);
  } catch (error) {
    failLogger({
      instance: loggerInstance,
      name: _LOGGER_NAME,
      options: { text: 'FAILED while trying to run validateUsers...' },
    });
    console.error(error);
  } finally {
    succeedLogger({
      instance: loggerInstance,
      name: _LOGGER_NAME,
      options: { text: 'logDatafully Ran validateUsers...' },
    });
  }
};

export { deleteUsers };
