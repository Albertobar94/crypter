import axios from 'axios';
import inquirer from 'inquirer';
import fs from 'fs';
import path, { resolve } from 'path';
import chalk from 'chalk';
import { getUsersErrorsTransformer, getUsersTransformer } from '../../common/mappers';
import { makeEmailIdUrl, makeUserIdUrl } from '../../common/helpers';
import { readFile, writeFile } from '../../utils/io';
import {
  createLogger,
  failLogger,
  logData,
  logDebug,
  startLogger,
  succeedLogger,
  updateLogger,
} from '../../utils/logging';
import { doSequencialRequest } from '../../utils/requestSequencially';
import {
  ActionType,
  Confirmation,
  DeepPartial,
  FFormant,
  Includes,
  IncludesType,
  MethodType,
  NoUndefinedField,
  PayloadType,
} from '../../common/types';
import got from 'got/dist/source';

/*----------  Types  ----------*/

interface Props {
  type?: keyof typeof PayloadType | null;
  file?: string | null;
  userId?: string | null;
  emailId?: string | null;
  includes?: string;
  outputDir?: string;
  debug?: boolean;
  hideLogs?: boolean;
}

type State = {
  action: keyof typeof ActionType | null;
  payload: {
    type: keyof typeof PayloadType | null;
    file: string | null;
    userId: string | null;
    emailId: string | null;
    includes: string | null;
    debug: boolean;
    hideLogs: boolean;
    outputDir?: string;
  };
};

/*----------  Utilities  ----------*/

async function checkForMissingState(state: State): Promise<NoUndefinedField<State>> {
  const { userId, emailId, file, outputDir, includes, hideLogs } = state.payload;

  // ! Required Values
  if (!userId && !emailId && !file) {
    const { payloadType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'payloadType',
        message: 'Please provide a userId, emailId or file to fetch user/s',
        choices: [PayloadType.emailId, PayloadType.userId, PayloadType.file],
        filter(val) {
          return val;
        },
      },
    ]);

    switch (payloadType) {
      case PayloadType.emailId:
        const { emailId } = await inquirer.prompt([
          {
            type: 'input',
            name: 'emailId',
            message: "What's the user emailId?",
            default() {
              return 'albertobarboza94@gmail.com';
            },
          },
        ]);
        mutateState(state, {
          action: ActionType.getSingleUser,
          payload: {
            type: PayloadType.emailId,
            emailId,
          },
        });
        break;
      case PayloadType.userId:
        const { userId } = await inquirer.prompt([
          {
            type: 'input',
            name: 'userId',
            message: "What's the user userId?",
            default() {
              return '31f71390-bd88-11eb-b787-f7f9253ee254';
            },
          },
        ]);
        mutateState(state, {
          action: ActionType.getSingleUser,
          payload: {
            type: PayloadType.userId,
            userId,
          },
        });
        break;
      case PayloadType.file:
        inquirer.registerPrompt(
          'file-tree-selection',
          require('inquirer-file-tree-selection-prompt'),
        );
        const { file } = await inquirer.prompt([
          {
            type: 'file-tree-selection',
            name: 'file',
            message: `Select a file`,
            pageSize: 10,
            root: resolve(getDefaultOutputDir()),
            validate: (input: string) => {
              const name = input?.split(path.sep).pop();
              const isFile = name?.endsWith(FFormant.csv) || name?.endsWith(FFormant.json);
              return name![0] !== '.' && isFile;
            },
            transformer: input => {
              const name = input.split(path.sep).pop();
              if (name[0] == '.') {
                return chalk.grey(name);
              }
              return name;
            },
          },
        ]);
        mutateState(state, {
          action: ActionType.getMultipleUsers,
          payload: {
            type: PayloadType.file,
            file,
          },
        });
        break;
    }
  }

  if (!includes && state.action !== ActionType.getMultipleUsers) {
    const { includesArr } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'includesArr',
        message: 'Would you like to include?',
        choices: [
          {
            name: 'None',
            value: Includes.none,
          },
          {
            name: 'All',
            value: Includes.all,
          },
          {
            name: 'Segments',
            value: Includes.segments,
          },
          {
            name: 'Preferences',
            value: Includes.preferences,
          },
          {
            name: 'Addresses',
            value: Includes.addresses,
          },
          {
            name: 'Organizations',
            value: Includes.organizations,
          },
        ],
        validate(answer: string[]) {
          if (answer.length < 1) {
            return 'You must pick at least choice!';
          }
          return true;
        },
        filter(answerArr: string[]) {
          if (answerArr.includes(Includes.all)) {
            return [Includes.all];
          }
          if (answerArr.includes(Includes.none)) {
            return [Includes.none];
          }
          return answerArr;
        },
      },
    ]);
    mutateState(state, {
      payload: {
        includes: includesArr.join(','),
      },
    });
  }

  if (!outputDir && !hideLogs) {
    const {
      confirm: [answer],
    } = await inquirer.prompt({
      type: 'checkbox',
      name: 'confirm',
      message: `Would to create a file?`,
      choices: [
        {
          name: Confirmation.Yes,
        },
        {
          name: Confirmation.No,
        },
      ],
      validate(answer) {
        if (answer.length < 1) {
          return 'Please choose one answer';
        }
        if (answer.length > 1) {
          return 'Please choose Only one answer';
        }
        if (state.action === ActionType.getMultipleUsers && answer[0] !== Confirmation.Yes) {
          return 'You must choose Yes!';
        }
        return true;
      },
    });

    switch (answer) {
      case Confirmation.Yes:
        inquirer.registerPrompt(
          'file-tree-selection',
          require('inquirer-file-tree-selection-prompt'),
        );
        const { outputDirValue } = await inquirer.prompt([
          {
            type: 'file-tree-selection',
            name: 'outputDirValue',
            message: `Select root \"${getDefaultOutputDir()}\" directory or any subdirectories to create file`,
            pageSize: 10,
            root: resolve(getDefaultOutputDir()),
            validate: (input: string) => {
              const name = input?.split(path.sep).pop();
              const isFile = name?.endsWith(FFormant.csv) || name?.endsWith(FFormant.json);
              return name![0] !== '.' && !isFile;
            },
            transformer: (input: string) => {
              const name = input.split(path.sep).pop();
              const isFile = name?.endsWith(FFormant.csv) || name?.endsWith(FFormant.json);
              if (name![0] == '.' && !isFile) {
                return chalk.grey(name);
              }
              return name;
            },
          },
        ]);
        mutateState(state, {
          payload: {
            outputDir: outputDirValue,
          },
        });
        break;
      case Confirmation.No:
        break;
    }
  }

  return state as NoUndefinedField<State>;
}
function createState(props: Props): State {
  const {
    file,
    userId,
    emailId,
    outputDir,
    includes,
    // ! Default Values
    debug = false,
    hideLogs = false,
  } = props;
  const state: State = {
    action: null,
    payload: {
      type: null,
      file: null,
      userId: null,
      emailId: null,
      includes: includes ?? null,
      debug,
      hideLogs,
      outputDir,
    },
  };

  if (userId) {
    state.action = ActionType.getSingleUser;
    state.payload.type = PayloadType.userId;
    state.payload.userId = userId;
  }
  if (emailId) {
    state.action = ActionType.getSingleUser;
    state.payload.type = PayloadType.emailId;
    state.payload.emailId = emailId;
  }
  if (file) {
    state.action = ActionType.getMultipleUsers;
    state.payload.type = PayloadType.file;
    state.payload.file = file;
  }

  return state;
}
function mutateState(state: State, newState: DeepPartial<State>): void {
  (state.action = newState.action ?? state.action),
    (state.payload = {
      ...state.payload,
      ...(newState.payload as State['payload']),
    });
}
function getDefaultOutputDir(): string {
  return `${process.env.DEFAULT_OUTPUT_DIR}`;
}
function fileIsEmpty(data: Record<string, any>): Boolean {
  return !data?.[0]?.userId && !data?.[0]?.emailId;
}

function makeUrl(type: Exclude<PayloadType, PayloadType.file>): string {
  return type === PayloadType.userId
    ? `${process.env.USER_SERVICE_HOST}/v1/users/:userId`
    : `${process.env.USER_SERVICE_HOST}/v1/users?emailId=:emailId`;
}
function createOutputDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}
function dirExists(dir: string): Boolean {
  return fs.existsSync(dir);
}
function makeSureOutputDirExists(defaultOutputDir: string): void {
  if (!dirExists(defaultOutputDir)) createOutputDir(defaultOutputDir);
}

/*=============================================
=                    Services                 =
=============================================*/

const getSingleUser = async ({ userId, emailId, includes, outputDir, debug, hideLogs }: Props) => {
  const _makeUrl = userId ? makeUserIdUrl : makeEmailIdUrl;
  const _user = userId ? userId : emailId;
  const _includesArr = (
    includes === 'all' || includes === 'none' ? includes : includes?.split(',')
  ) as IncludesType;

  if (debug)
    logDebug({
      message: `Id: ${_user}, Url: ${_makeUrl(
        _user!,
        _includesArr,
      )}, includes ${typeof _includesArr}: ${_includesArr}`,
    });

  const { body }: { body: any } = await got({
    url: _makeUrl(_user!, _includesArr),
    method: MethodType.get,
    headers: {
      Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
      'x-tenant-id': process.env.FACL_TENANT_ID!,
    },
    responseType: 'json',
  });

  // ! Log Response or Return response
  if (!outputDir) {
    if (!hideLogs) {
      logData({
        data: userId ? body.data.user : body.data,
        message: `User Information`,
      });
    }
    return {
      body,
    };
  }

  return writeFile({
    exportPath: `${outputDir}/${_user}.${FFormant.json}`,
    format: FFormant.json,
    content: userId ? body.data.user : body.data,
    debug,
  });
};

const getMultipleUsers = async ({ file, outputDir, debug }: Props) => {
  const exportDataPath = `${outputDir}/success.csv`;
  const exportErrorsPath = `${outputDir}/errors.csv`;

  const data = await readFile({ file: file!, format: FFormant.csv });
  const injectValue = data?.[0]?.userId ? PayloadType.userId : PayloadType.emailId;
  const url = makeUrl(injectValue);

  if (!data) throw new Error('There must be data in file');
  if (fileIsEmpty(data)) throw new Error('Columns userId or emailId must be in the file');
  if (debug)
    logDebug({
      data: data?.[0],
      message: 'debugging getMultipleUsers...',
    });

  const { logData, errors } = await doSequencialRequest({
    data,
    intervalTime: 3,
    concurrency: 2500,
    pauseTime: 2500,
    url,
    injectValue,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
      'x-tenant-id': process.env.FACL_TENANT_ID,
    },
    logDataCallback: async (res, req) => {
      const { body } = res;
      if (debug) {
        logDebug({
          data: {
            req,
          },
          message: 'Debugging validateUsers...',
        });
      }
      return getUsersTransformer({ payload: body, metadata: req, transformType: injectValue });
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
      return getUsersErrorsTransformer({ error, metadata: req, transformType: injectValue });
    },
    debug: debug!,
  });

  return (
    writeFile({
      content: errors,
      exportPath: exportErrorsPath,
      format: FFormant.csv,
    }),
    writeFile({ content: logData, exportPath: exportDataPath, format: FFormant.csv })
  );
};

export const getUser = async (props: Props) => {
  const instance = createLogger();

  try {
    const outputDir = getDefaultOutputDir();
    const incomingState = createState(props);

    makeSureOutputDirExists(outputDir);
    const state = await checkForMissingState(incomingState);

    startLogger({
      instance,
      name: 'getUser',
      options: { text: 'Running getUser...' },
    });

    switch (state.action) {
      case ActionType.getMultipleUsers:
        updateLogger({
          instance,
          name: 'getUser',
          options: { text: 'Running getMultipleUsers...' },
        });
        return await getMultipleUsers({
          ...state.payload,
        });
      case ActionType.getSingleUser:
        updateLogger({
          instance,
          name: 'getUser',
          options: { text: 'Running getSingleUser...' },
        });
        return await getSingleUser({
          ...state.payload,
        });
    }
  } catch (error) {
    failLogger({
      instance,
      name: 'getUser',
      options: { text: 'FAILED while trying to run getUser...' },
    });
    console.error(error);
  } finally {
    succeedLogger({
      instance,
      name: 'getUser',
      options: { text: 'Success...' },
    });
  }
};
