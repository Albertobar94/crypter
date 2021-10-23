import inquirer from 'inquirer';
import path, { resolve } from 'path';
import chalk from 'chalk';
import { getUser as getUserFromCore } from '.';
import { writeFile } from '../../utils/io';
import {
  createLogger,
  failLogger,
  logData,
  logDebug,
  startLogger,
  succeedLogger,
} from '../../utils/logging';
import {
  ActionType,
  Confirmation,
  FFormant,
  Includes,
  MethodType,
  NoUndefinedField,
  PayloadType,
  Props,
  Segments,
  State,
} from '../../common/types';
import { createState, mutateState } from '../../common/model';
import {
  getOutputDir,
  getSegments,
  makeSureOutputDirExists,
  normalizeSegments,
  registerUserSegments,
} from '../../common/utilities';

interface P extends Omit<Props, 'segmentNames'> {}

/*----------  Utilities  ----------*/

async function checkForMissingState(state: State): Promise<NoUndefinedField<State>> {
  let { userId, emailId, file, outputDir, segments, method, dryRun } = state.payload;

  // ! Required Values
  if (!userId && !emailId && !file) {
    const { payloadType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'payloadType',
        message: 'Please provide a userId, emailId or file to fetch user/s',
        choices: [PayloadType.emailId, PayloadType.userId, PayloadType.file],
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
            root: resolve(getOutputDir()),
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

  if (!segments && method !== MethodType.get && state.action !== ActionType.getMultipleUsers) {
    const coreSegments = await getSegments();
    const { segments }: { segments: Segments } = await inquirer.prompt({
      type: 'checkbox',
      name: 'segments',
      message: `Choose one or more segments to register`,
      choices: coreSegments.map(s => ({ name: s.name, value: { id: s.id, name: s.name } })),
      validate(answer) {
        if (answer.length < 1) {
          return 'Please choose one answer';
        }
        return true;
      },
    });
    mutateState(state, {
      payload: {
        segments,
      },
    });
  }

  if (!outputDir) {
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
        if (state.payload.type === PayloadType.file && answer[0] !== Confirmation.Yes) {
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
            message: `Select root \"${getOutputDir()}\" directory or any subdirectories to create file`,
            pageSize: 10,
            root: resolve(getOutputDir()),
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

  if (!dryRun && method !== MethodType.get && state.action !== ActionType.getMultipleUsers) {
    const {
      confirm: [answer],
    } = await inquirer.prompt({
      type: 'checkbox',
      name: 'confirm',
      message: `Would to register segments?`,
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
        return true;
      },
    });

    switch (answer) {
      case Confirmation.Yes:
        mutateState(state, {
          payload: {
            dryRun: false,
          },
        });
        break;
      case Confirmation.No:
        mutateState(state, {
          payload: {
            dryRun: true,
          },
        });
    }
  }

  return state as NoUndefinedField<State>;
}

// function fileIsEmpty(data: Record<string, any>): Boolean {
//   // TODO refactor to only access the required property
//   return !data?.[0]?.userId && !data?.[0]?.emailId && !data?.[0]?.segments.length;
// }

/*----------  Services  ----------*/

const performUserSegments = async (props: P): Promise<void> => {
  const {
    file,
    userId: incomingUserId,
    emailId,
    segments: segmentsToRegister,
    method,
    outputDir,
    dryRun,
    debug,
    hideLogs,
  } = props;
  let content: any;

  const { body }: any = await getUserFromCore({
    emailId,
    userId: incomingUserId,
    includes: Includes.segments,
    debug,
    hideLogs: true,
  });

  const {
    userId,
    email: { emailId: e },
    segments,
  } = incomingUserId ? body?.data?.user : body?.data?.users?.[0];

  switch (method) {
    case MethodType.get:
      if (!outputDir) {
        return logData({
          data: {
            segments: normalizeSegments(segments),
          },
          message: `Segments for user ${emailId ?? e}`,
        });
      }
      content = normalizeSegments(segments);
      break;
    case MethodType.post:
      if (dryRun) {
        if (!outputDir) {
          return logData({
            data: {
              segments: normalizeSegments(segmentsToRegister!),
            },
            message: `DRY-RUN -> Segments to register for ${emailId}`,
          });
        }
        content = normalizeSegments(segments);
        break;
      }
      content = await registerUserSegments(segmentsToRegister!, userId, debug!);
      break;
  }

  writeFile({
    content,
    exportPath: `${outputDir}/segments-result.csv`,
    format: FFormant.csv,
  });
};

const userSegment = async (props: Props) => {
  const instance = createLogger();

  try {
    const incomingState = await createState(props);
    const outputDir = getOutputDir();

    makeSureOutputDirExists(outputDir);

    const state = await checkForMissingState({
      ...incomingState,
      payload: {
        ...incomingState.payload,
        includes: Includes.segments,
      },
    });

    startLogger({
      instance,
      name: 'userSegment',
      options: { Text: 'Running userSegment...' },
    });

    switch (state.action) {
      case ActionType.getSingleUser:
        return await performUserSegments({
          ...state.payload,
        });
      // case ActionType.getMultipleUsers:
      //   return await usersSegments({
      //     ...state.payload,
      //   });
    }
  } catch (error) {
    failLogger({
      instance,
      name: 'userSegment',
      options: { Text: 'Failed to run userSegment...' },
    });
    console.error(error);
  } finally {
    succeedLogger({
      instance,
      name: 'userSegment',
      options: { Text: 'Success...' },
    });
  }
};

export { userSegment };
