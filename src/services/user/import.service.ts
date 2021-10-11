import got from 'got/dist/source';
import { readFile, writeFile } from '../../utils/io';
import { logData, logInfo, logError } from '../../utils/logging';
import { transformRecordForUserImport } from '../../common/mappers';
import { FFormant } from '../../common/types';

const METADATA = {
  importUser: 'importUser',
};

interface Props {
  file?: string;
  outputDir?: string;
}

const importUser = async ({ file, outputDir }: Props) => {
  const EXPORT_PATH_logData_REPORT = `${outputDir}/PROD-import-user-logData.csv`;
  const EXPORT_PATH_RETRYABLE_ERROR_REPORT = `${outputDir}/PROD-import-user-retryable-error.csv`;
  const EXPORT_PATH_NON_RETRYABLE_ERROR_REPORT = `${outputDir}/PROD-import-user-non-retryable-error.csv`;

  const PROMISE_CONCURRENCY = 250;

  const nonRetryableErrors: any[] = [];
  const users: any[] = [];
  const retryableErrors: any[] = [];

  try {
    if (!file) throw new Error();

    const data = await readFile({ file, format: 'csv' });

    const requestBodys = data.map(record => {
      return transformRecordForUserImport(record);
    });

    let counter = 0;
    let promise = 0;
    const requestsLength = requestBodys.length;
    const sleep = async ms => {
      return new Promise(res => setTimeout(res, ms || 4000));
    };

    for await (let request of requestBodys) {
      try {
        if (counter === PROMISE_CONCURRENCY) {
          logInfo({
            serviceName: 'requestBodys',
            message: `Made ${counter} requests going to sleep...`,
          });
          counter = 0;
          await sleep(5000);
        }
        await sleep(50);
        counter++;
        logInfo({
          serviceName: 'requestBodys',
          message: `Making then request with body ${counter}`,
        });

        got({
          url: `${process.env.USER_SERVICE_HOST}/v1/users/import`,
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
            'x-tenant-id': process.env.FACL_TENANT_ID,
          },
          json: request,
          responseType: 'json',
        })
          .then(result => {
            promise++;
            // @ts-expect-error
            const { data, error, body }: { body?: any } = result;
            logInfo({
              serviceName: 'THEN',
              message: 'logData',
              data: {
                data,
                body,
              },
              error,
            });
            if (error) {
              const formattedError = {
                userId:
                  error?.response?.statusCode || error?.code < 500
                    ? error?.response?.body?.errors?.[0]?.message.split(' ')[5]
                    : null,
                statusCode: error?.response?.statusCode || error?.code,
                error: {
                  statusCode: error?.response?.statusCode || error?.code,
                  body: error?.response?.body,
                },
              };

              if (
                typeof formattedError.statusCode === 'string' ||
                formattedError.statusCode >= 500
              ) {
                retryableErrors.push(formattedError);
              } else {
                nonRetryableErrors.push(formattedError);
              }
              logError({
                serviceName: 'RESPONSE',
                error: formattedError,
                message: 'FAILED',
              });
            } else {
              const user = {
                id: body?.data?.user?.userId,
                accountId: body?.data?.user?.accountIds[0],
              };
              users.push(user);

              logInfo({
                serviceName: 'RESPONSE',
                message: 'logData',
                data,
              });
            }
          })
          .catch(error => {
            promise++;
            const formattedError = {
              userId:
                error?.response?.statusCode || error?.code < 500
                  ? error?.response?.body?.errors?.[0]?.message.split(' ')[5]
                  : null,
              statusCode: error?.response?.statusCode || error?.code,
              error: {
                statusCode: error?.response?.statusCode || error?.code,
                body: error?.response?.body,
              },
            };

            if (typeof formattedError.statusCode === 'string' || formattedError.statusCode >= 500) {
              retryableErrors.push(formattedError);
            } else {
              nonRetryableErrors.push(formattedError);
            }

            logError({
              serviceName: 'RESPONSE',
              error: formattedError,
              message: 'FAILED',
            });
          });
      } catch (error: any) {
        logError({
          serviceName: METADATA.importUser,
          error,
          message: `FAILED while Running ${METADATA.importUser} with id ?????`,
        });
      }
    }

    while (promise < requestsLength) {
      await sleep(1000);
    }

    writeFile({
      content: retryableErrors,
      exportPath: EXPORT_PATH_RETRYABLE_ERROR_REPORT,
      format: FFormant.csv,
    });
    writeFile({
      content: nonRetryableErrors,
      exportPath: EXPORT_PATH_NON_RETRYABLE_ERROR_REPORT,
      format: FFormant.csv,
    });
    writeFile({
      content: users,
      exportPath: EXPORT_PATH_logData_REPORT,
      format: FFormant.csv,
    });
  } catch (error) {
    logError({
      serviceName: METADATA.importUser,
      error,
      message: `FAILED while Running ${METADATA.importUser} with id ?????`,
    });
  } finally {
    logData({
      serviceName: METADATA.importUser,
      message: `logDatafully ran ${METADATA.importUser} with id ????`,
    });
  }
};

export { importUser };
