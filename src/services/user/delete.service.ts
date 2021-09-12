import inquirer from 'inquirer';
import { doSequencialRequest } from '../../utils/requestSequencially';
import { exportReport } from '../../utils/io';
import { readFile } from '../../utils/io';
import { failLogger, startLogger, succeedLogger, createLogger } from '../../utils/logging';
import { halt } from '../../utils/bootstrap';
import { getUser as getUserBackup } from './get.service';

interface Props {
  userId: string;
  userEmail: string;
  file: string;
  fileFormat: 'csv' | 'json';
  outputDir: string;
  debug: boolean;
  dryRun: boolean;
}

const deleteUsers = async ({
  userId,
  userEmail,
  file,
  fileFormat = 'csv',
  outputDir,
  debug,
  dryRun,
}: Props) => {
  if (!userId && !file && !userEmail) throw new Error('File, userId or emailId must be specified');
  if (!outputDir) throw new Error('Output path must be given');

  const _URL = userId
    ? `${process.env.USER_SERVICE_HOST}/v1/users/${userId}`
    : `${process.env.USER_SERVICE_HOST}/v1/users/:userId`;
  const _logData_EXPORT_PATH = `${outputDir}/success.${fileFormat.toLocaleLowerCase()}`;
  const _ERRORS_EXPORT_PATH = `${outputDir}/error.${fileFormat.toLocaleLowerCase()}`;
  const _USER = userId ?? userEmail;
  let instance: any;

  try {
    switch (_USER) {
      case undefined:
        const data = await readFile({
          file,
          parser: fileFormat,
        });

        const { confirm } = await inquirer.prompt({
          type: 'confirm',
          name: 'confirm',
          message: `Would you like to delete ${data.length} users?`,
          default: false,
        });
        if (!confirm) break;

        instance = createLogger();
        startLogger({
          instance,
          name: 'deleteUsers',
          options: { text: 'Proceeding to delete users...' },
        });

        if (dryRun) return;

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
          loggerInstance: instance,
          debug,
        });

        await exportReport(logData, _logData_EXPORT_PATH);
        await exportReport(errors, _ERRORS_EXPORT_PATH);
        break;
      default:
        const { first } = await inquirer.prompt({
          type: 'confirm',
          name: 'first',
          message: `Would you like to delete user ${_USER}?`,
          default: false,
        });
        if (!first) break;

        const res = await getUserBackup({
          userId,
          userEmail,
          debug,
          includes: 'none',
          _hideLogs: true,
        });

        const { second } = await inquirer.prompt({
          type: 'confirm',
          name: 'second',
          message: `Are you sure you want to delete user with id ${
            userId ? res.data.data.user.userId : res.data.data.users?.[0]?.userId
          }?`,
          default: false,
        });
        if (!second) break;

        if (dryRun) {
          return await getUserBackup({
            userId,
            userEmail,
            debug,
            includes: 'none',
            _hideLogs: false,
          });
        }

        instance = createLogger();
        startLogger({
          instance,
          name: 'deleteUsers',
          options: { text: 'Awaiting 7.5 seconds before proceeding to delete user...' },
        });
        await halt(7500);

        await getUserBackup({
          userId,
          userEmail,
          outputDir,
          fileFormat: 'json',
          debug,
          includes: 'all',
        });

        // TODO Delete User
        break;
    }
  } catch (error) {
    if (!instance) return;
    failLogger({
      instance,
      name: 'deleteUsers',
      options: { text: 'FAILED while trying to run validateUsers...' },
    });
    console.error(error);
  } finally {
    if (!instance) return;
    succeedLogger({
      instance,
      name: 'deleteUsers',
      options: { text: `${dryRun ? 'done...' : 'Success...'}` },
    });
  }
};

export { deleteUsers };
