import { doSequencialRequest } from '../../utils/requestSequencially';
import { readFile, writeFile } from '../../utils/io';
import {
  failLogger,
  startLogger,
  succeedLogger,
  updateLogger,
  createLogger,
  logDebug,
} from '../../utils/logging';
import { validateErrorsTransformer, validateTransformer } from '../../common/mappers';
import { FFormant } from '../../common/types';

interface Props {
  file: string;
  fileFormat: 'csv' | 'json';
  outputPath: string;
  type: 'emailId' | 'userId';
  debug: boolean;
  dryRun: boolean;
}

const validateUsers = async ({
  file,
  fileFormat = 'csv',
  outputPath,
  debug,
  dryRun,
  type = 'userId',
}: Props) => {
  const instance = createLogger();

  try {
    if (!file) throw new Error('File path must be given');
    if (!outputPath) throw new Error('Output path must be given');

    startLogger({
      instance,
      name: 'validateUsers',
      options: { text: 'Running validateUsers...' },
    });

    if (debug) {
      logDebug({
        data: {
          file,
          fileFormat,
          outputPath,
          debug,
          dryRun,
          type,
        },
        message: 'Debugging validateUsers...',
      });
    }

    const _URL =
      type === 'userId'
        ? `${process.env.USER_SERVICE_HOST}/v1/users/:userId`
        : `${process.env.USER_SERVICE_HOST}/v1/users?emailId=:emailId`;

    // TODO if no output path stop

    const _DATA_EXPORT_PATH = `${outputPath}/data.${fileFormat.toLocaleLowerCase()}`;
    const _ERRORS_EXPORT_PATH = `${outputPath}/errors.${fileFormat.toLocaleLowerCase()}`;

    const data = await readFile({ file, format: fileFormat });

    const { logData, errors } = await doSequencialRequest({
      data,
      intervalTime: 3,
      concurrency: 2500,
      pauseTime: 2500,
      url: _URL,
      injectValue: type === 'userId' ? 'userId' : 'emailId',
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
        'x-tenant-id': process.env.FACL_TENANT_ID,
      },
      logDataCallback: async (res, req) => {
        const { data, body } = res;
        if (debug) {
          logDebug({
            data: {
              req,
            },
            message: 'Debugging validateUsers...',
          });
        }
        return validateTransformer({ payload: body, metadata: req, transformType: type });
      },
      errorsCallback: async (error, req) => {
        if (debug) {
          logDebug({
            data: {
              req,
              error,
            },
            message: 'Debugging validateUsers...',
          });
        }
        return validateErrorsTransformer({ error, metadata: req, transformType: type });
      },
      loggerInstance: instance,
      debug,
    });

    updateLogger({
      instance,
      name: 'validateUsers',
      options: { text: 'Running exportReport...' },
    });

    return (
      writeFile({
        content: logData,
        exportPath: _DATA_EXPORT_PATH,
        format: FFormant.csv,
      }),
      writeFile({
        content: errors,
        exportPath: _ERRORS_EXPORT_PATH,
        format: FFormant.csv,
      })
    );
  } catch (error) {
    failLogger({
      instance,
      name: 'validateUsers',
      options: { text: 'FAILED while trying to run validateUsers...' },
    });
    console.error(error);
  } finally {
    succeedLogger({
      instance,
      name: 'validateUsers',
      options: { text: 'logDatafully Ran validateUsers...' },
    });
  }
};

export { validateUsers };
