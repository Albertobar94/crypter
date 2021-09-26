import { doSequencialRequest } from '../../utils/requestSequencially';
import { exportReport } from '../../utils/io';
import { readFile } from '../../utils/io';
import {
  failLogger,
  startLogger,
  succeedLogger,
  updateLogger,
  createLogger,
} from '../../utils/logging';
import { validateErrorsTransformer, validateTransformer } from '../../utils/callbacks';

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

    const _URL =
      type === 'userId'
        ? `${process.env.USER_SERVICE_HOST}/v1/users/:userId`
        : `${process.env.USER_SERVICE_HOST}/v1/users?emailId=:emailId`;

    // TODO if no output path stop

    const _DATA_EXPORT_PATH = `${outputPath}/data.${fileFormat.toLocaleLowerCase()}`;
    const _ERRORS_EXPORT_PATH = `${outputPath}/errors.${fileFormat.toLocaleLowerCase()}`;

    const data = await readFile({ file, parser: fileFormat });

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
      logDataCallback: async res => {
        const { data, body } = res;
        return validateTransformer({ payload: body, transformType: type });
      },
      errorsCallback: async error => {
        return validateErrorsTransformer({ error, transformType: type });
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
      await exportReport(logData, _DATA_EXPORT_PATH),
      await exportReport(errors, _ERRORS_EXPORT_PATH)
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
