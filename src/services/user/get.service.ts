import axios from 'axios';
import { _makeUserEmailUrl, _makeUserIdUrl } from '../../utils/helpers';
import { writeFile } from '../../utils/io';
import { logData, logDebug, logError } from '../../utils/logging';

interface getUserProps {
  userId?: string;
  userEmail?: string;
  outputDir?: string;
  fileFormat?: 'csv' | 'json';
  debug?: boolean;
  includes: 'all' | 'none';
  _hideLogs?: boolean;
}

const getUser = async ({
  userId,
  userEmail,
  includes = 'none',
  outputDir,
  fileFormat = 'json',
  debug = false,
  _hideLogs = false,
}: getUserProps) => {
  let response: any;
  let _makeUserUrl = userId ? _makeUserIdUrl : _makeUserEmailUrl;
  const _user = userId ? userId : userEmail;

  if (debug) {
    logDebug({
      message: `Id: ${_user}, Url: ${_makeUserUrl(_user!, includes)}`,
    });
  }

  try {
    response = await axios.get(_makeUserUrl(_user!, includes), {
      headers: {
        Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
      },
    });

    if (!outputDir) {
      if (debug) {
        logDebug({
          data: userId ? response.data.data.user : response.data.data,
          message: `Successful Response`,
        });
      }
      if (!_hideLogs) {
        logData({
          data: userId ? response.data.data.user : response.data.data,
          message: `User Information`,
        });
      }
      return response;
    }

    return await writeFile({
      outputFile: `${outputDir}/${_user}.${fileFormat.toLocaleLowerCase()}`,
      parser: fileFormat,
      content: userId ? response.data.data.user : response.data.data,
      debug,
    });
  } catch (error) {
    logError({
      message: `Id: ${_user}`,
    });
    console.error(error);
  }
};

export { getUser };
