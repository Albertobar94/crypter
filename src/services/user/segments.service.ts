import got from 'got/dist/source';
import { _makeSegmentsUrl, _makeUserEmailUrl, _makeUserIdUrl } from '../../utils/helpers';
import { writeFile } from '../../utils/io';
import {
  createLogger,
  failLogger,
  logData,
  logDebug,
  startLogger,
  succeedLogger,
} from '../../utils/logging';

interface userSegmentProps {
  file?: string;
  userEmail?: string;
  outputDir?: string;
  segments?: string;
  fileFormat?: 'csv' | 'json';
  debug?: boolean;
  _hideLogs?: boolean;
  dryRun?: boolean;
  action?: 'get' | 'post';
}

const getUserSegments = async ({
  file,
  userEmail,
  outputDir,
  fileFormat = 'csv',
  debug = false,
  _hideLogs = false,
  action,
  dryRun,
}: userSegmentProps) => {
  const instance = createLogger();
  const readFromFile = !!file;
  const makeUrl = _makeUserEmailUrl;
  const url = makeUrl(userEmail!.trim(), ['segments']);

  try {
    startLogger({
      instance,
      name: 'getUserSegments',
      options: { text: 'Running getUserSegments...' },
    });

    if (debug) {
      logDebug({
        data: {
          file,
          userEmail,
          outputDir,
          url,
          headers: {
            Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
            'x-tenant-id': process.env.FACL_TENANT_ID!,
          },
        },
        message: 'debugging getUserSegments',
      });
    }

    switch (readFromFile) {
      case false:
        const { body }: { body: any } = await got({
          url,
          method: 'GET',
          headers: {
            Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
            'x-tenant-id': process.env.FACL_TENANT_ID!,
          },
          responseType: 'json',
        });
        const segments = body?.data?.users?.[0]?.segments.map(segment => {
          return {
            id: segment?.id,
            name: segment?.name,
          };
        });

        if (!outputDir) {
          return logData({
            data: segments,
            message: `Segments for user ${userEmail}`,
          });
        }

        return await writeFile({
          outputFile: `${outputDir}/${userEmail}-segments.${fileFormat.toLocaleLowerCase()}`,
          parser: fileFormat,
          content: segments,
          debug,
        });
      case true:
        if (!outputDir) return '';
        return '';
      default:
        break;
    }
  } catch (error) {
    failLogger({
      instance,
      name: 'getUserSegments',
      options: { text: 'FAILED while trying to run getUserSegments...' },
    });
    console.error(error);
  } finally {
    succeedLogger({
      instance,
      name: 'getUserSegments',
      options: { text: 'logDatafully Ran getUserSegments...' },
    });
  }
};

const postUserSegments = async ({
  file,
  userEmail,
  outputDir,
  fileFormat = 'csv',
  debug = false,
  dryRun,
  segments,
}: userSegmentProps) => {
  const instance = createLogger();
  const readFromFile = !!file;
  const url = _makeSegmentsUrl();

  try {
    startLogger({
      instance,
      name: 'postUserSegments',
      options: { text: 'Running postUserSegments...' },
    });

    switch (readFromFile) {
      case false:
        const { body }: { body: any } = await got({
          url,
          method: 'GET',
          headers: {
            Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
            'x-tenant-id': process.env.FACL_TENANT_ID!,
          },
          responseType: 'json',
        });
        const segmentsNamesReceived = segments?.split(',');
        const coreSegments = body?.data?.segments?.map(segment => {
          return {
            id: segment?.id,
            name: segment?.name,
          };
        });
        const segmentsToRegister = coreSegments?.filter(segment => {
          if (segmentsNamesReceived?.includes(segment?.name)) return true;
          return false;
        });
        if (debug) {
          logDebug({
            message: 'Debugging postUserSegments',
            data: {
              segmentsNamesReceived,
              coreSegments,
              segmentsToRegister,
              body,
            },
          });
        }
        if (dryRun) {
          return logData({
            data: segmentsToRegister,
            message: `DRY RUN -> Segments to register for user ${userEmail}`,
          });
        }
        // TODO build the request body and execute
        // TODO write file or log on the console.
        break;
      case true:
        break;
      default:
        break;
    }
  } catch (error) {
    failLogger({
      instance,
      name: 'postUserSegments',
      options: { text: 'FAILED while trying to run postUserSegments...' },
    });
    console.error(error);
  } finally {
    succeedLogger({
      instance,
      name: 'postUserSegments',
      options: { text: 'logDatafully Ran postUserSegments...' },
    });
  }
};

const userSegment = async ({
  file,
  userEmail,
  outputDir,
  fileFormat = 'csv',
  debug = false,
  _hideLogs = false,
  action,
  dryRun,
  segments,
}: userSegmentProps) => {
  if (!file && !userEmail) throw new Error('File to read or user email must be provided');
  switch (action) {
    case 'get':
      return getUserSegments({
        file,
        userEmail,
        outputDir,
        fileFormat,
        debug,
        _hideLogs,
      });
    case 'post':
      return postUserSegments({
        file,
        userEmail,
        outputDir,
        fileFormat,
        debug,
        _hideLogs,
        segments,
        dryRun,
      });
    default:
      throw new Error('Action type for segments service must be provided');
  }
};

export { userSegment };
