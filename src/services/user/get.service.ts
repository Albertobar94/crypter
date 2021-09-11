import axios from 'axios';
import { writeFile } from '../../utils/io';
import { logData, logDebug, logError } from '../../utils/logging';

interface getUserProps {
  userId?: string;
  userEmail?: string;
  outputDir?: string;
  fileFormat?: 'CSV' | 'JSON';
  debug?: boolean;
}

const _ID_URI = (userId: string) => {
  return `${process.env.USER_SERVICE_HOST}/v1/users/${
    userId.toString() !== 'true' ? userId.trim() : process.env.USER_ID
  }`;
};
const _EMAIL_URI = (emailId: string) => {
  return `${process.env.USER_SERVICE_HOST}/v1/users?emailId=${
    emailId.toString() !== 'true' ? emailId.trim() : process.env.USER_EMAIL
  }`;
};

const getUser = async ({ userId, userEmail, outputDir, fileFormat = 'JSON', debug = false }: getUserProps) => {
  let response: any;
  const _URI = userId ? _ID_URI : _EMAIL_URI;
  const _USER_ID = userId ? userId : userEmail;

  if (debug) {
    logDebug({
      message: `Id: ${_USER_ID}, Url: ${_URI(_USER_ID!)}`,
    });
  }

  try {
    response = await axios.get(_URI(_USER_ID!), {
      headers: {
        Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
      },
    });

    if (!outputDir) {
      return logData({
        data: userId ? response.data.data.user : response.data.data,
        message: `Successful Response`,
      });
    }

    return await writeFile({
      filePath: `${outputDir}/${_USER_ID}.${fileFormat.toLocaleLowerCase()}`,
      parser: fileFormat,
      content: userId ? response.data.data.user : response.data.data,
      debug,
    });
  } catch (error) {
    logError({
      message: `Id: ${_USER_ID}`,
    });
    console.error(error);
  }
};

export { getUser };
