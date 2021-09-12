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

interface Props {
  file: string;
  fileFormat: 'csv' | 'json';
  property: string;
  outputPath: string;
  debugLevel: boolean;
  type: 'emailId' | 'userId';
}

const validateUsers = async ({
  file,
  fileFormat = 'csv',
  property,
  outputPath,
  debugLevel,
  type = 'userId',
}: Props) => {
  let instance: any;
  let _LOGGER_NAME: string = 'SP_1';

  try {
    // Errors Stage //
    if (!file) throw new Error('File path must be given');
    if (!property) throw new Error('Property in file must be given');
    if (!outputPath) throw new Error('Output path must be given');

    // Type of call //
    const _URL =
      type === 'userId'
        ? `${process.env.USER_SERVICE_HOST}/v1/users/:userId`
        : `${process.env.USER_SERVICE_HOST}/v1/users?emailId=:emailId`;

    // Vars stage //
    const _logData_EXPORT_PATH = `${outputPath}/logData.${fileFormat.toLocaleLowerCase()}`;
    const _ERRORS_EXPORT_PATH = `${outputPath}/errors.${fileFormat.toLocaleLowerCase()}`;

    // Logging //
    instance = createLogger();
    startLogger({
      instance,
      name: _LOGGER_NAME,
      options: { text: 'Running validateUsers...' },
    });

    // Read stage //
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
        let transformer: any;
        if (type === 'userId') {
          // transformer = {
          //   id: body?.data?.user?.userId,
          //   accountId: body?.data?.user?.accountIds[0],
          //   emailId: body?.data?.user?.email.emailId,
          // };
        } else {
          // transformer = {
          //   id: body?.data?.users?.[0]?.userId,
          //   accountId: body?.data?.users?.[0]?.accountIds[0],
          //   emailId: body?.data?.users?.[0]?.email.emailId,
          // };
          transformer = body?.data?.users?.[0]?.iamUserId
            ? {
                id: body?.data?.users?.[0]?.userId,
                emailId: body?.data?.users?.[0]?.email.emailId,
                iamUserId: body?.data?.users?.[0]?.iamUserId,
                authenticationAgents: body?.data?.users?.[0]?.authenticationAgents,
              }
            : {
                id: body?.data?.users?.[0]?.userId,
                emailId: body?.data?.users?.[0]?.email.emailId,
                authenticationAgents: body?.data?.users?.[0]?.authenticationAgents,
              };
        }
        return transformer;
      },
      errorsCallback: async error => {
        let transformer: any;
        if (type === 'userId') {
          transformer = {
            userId: error?.response?.body?.errors?.[0]?.message.split(' ')[3],
            errorMessage: error?.response?.body?.errors?.[0]?.message,
            statusCode: error?.response?.statusCode || error?.code,
          };
        } else {
          transformer = {
            statusCode: error?.response?.statusCode || error?.code,
          };
        }
        return transformer;
      },
      loggerInstance: instance,
      debug: debugLevel,
    });

    // Export Stage
    updateLogger({
      instance,
      name: _LOGGER_NAME,
      options: { text: 'Running exportReport...' },
    });
    await exportReport(logData, _logData_EXPORT_PATH);
    await exportReport(errors, _ERRORS_EXPORT_PATH);
  } catch (error) {
    // ERROR({
    //   serviceName: 'validateUsers',
    //   error,
    //   message: 'ERROR while Running Extract CSV Service...',
    // });
    failLogger({
      instance,
      name: _LOGGER_NAME,
      options: { text: 'FAILED while trying to run validateUsers...' },
    });
    console.error(error);
  } finally {
    succeedLogger({
      instance,
      name: _LOGGER_NAME,
      options: { text: 'logDatafully Ran validateUsers...' },
    });
  }
};

export { validateUsers };
