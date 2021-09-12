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
  outputPath: string;
  debugLevel: boolean;
}

const updateOrder = async ({ file, fileFormat = 'csv', outputPath, debugLevel: debug }: Props) => {
  let instance: any;
  let _LOGGER_NAME: string = 'OR_1';

  try {
    // Errors Stage //
    if (!file) throw new Error('File path must be given');
    if (!outputPath) throw new Error('Output path must be given');

    // Vars stage //
    const _logData_EXPORT_PATH = `${outputPath}/logData.${fileFormat.toLocaleLowerCase()}`;
    const _ERRORS_EXPORT_PATH = `${outputPath}/errors.${fileFormat.toLocaleLowerCase()}`;

    // Type of call //
    const _URL = `${process.env.ORDERS_SERVICE_HOST}/v1/orders/:orderId/associateAccount`;

    // Logging //
    instance = createLogger();
    startLogger({
      instance,
      name: _LOGGER_NAME,
      options: { text: 'Running updateOrder...' },
    });

    // Read stage //
    const data = await readFile({ file, parser: fileFormat });

    const { logData, errors } = await doSequencialRequest({
      data,
      intervalTime: 3,
      concurrency: 2500,
      pauseTime: 2500,
      url: _URL,
      injectValue: 'orderId',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
        'x-tenant-id': process.env.FACL_TENANT_ID,
      },
      logDataCallback: async res => {
        const { data, body } = res;
        // INFO({
        //   serviceName: 'logData-CB',
        //   message: 'checking',
        //   data: {
        //     body,
        //     data,
        //   },
        // });
        const transformer = {
          orderId: body?.data?.order?.orderId,
          userId: body?.data?.order?.userId,
          accountId: body?.data?.order?.accountId,
          emailId: body?.data?.order?.email?.emailId,
          iamUserId: body?.data?.order?.iamUserId,
          allData: {
            ...body?.data?.order,
          },
        };

        return transformer;
      },
      errorsCallback: async error => {
        const transformer = {
          errorMessage: error?.response?.body?.errors?.[0]?.message,
          statusCode: error?.response?.statusCode || error?.code,
        };

        return transformer;
      },
      loggerInstance: instance,
      debug,
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
    failLogger({
      instance,
      name: _LOGGER_NAME,
      options: { text: 'FAILED while trying to run updateOrder...' },
    });
    console.error(error);
  } finally {
    succeedLogger({
      instance,
      name: _LOGGER_NAME,
      options: { text: 'logDatafully Ran updateOrder...' },
    });
  }
};

export { updateOrder };
