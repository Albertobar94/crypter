import got from 'got/dist/source';
import fs from 'fs';
import inquirer from 'inquirer';
import path, { resolve } from 'path';
import chalk from 'chalk';
import { getUser as getUserFromCore } from '.';
import { makeSegmentsUrl, makeEmailIdUrl, makeUserIdUrl } from '../../common/helpers';
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
  DeepPartial,
  FFormant,
  Includes,
  MethodType,
  NoUndefinedField,
  PayloadType,
  Segment,
  Segments,
} from '../../common/types';

/*----------  Types  ----------*/

// TODO create default interfaces and extend them locally
interface Props {
  action?: keyof typeof ActionType;
  type?: keyof typeof PayloadType;
  file?: string | null;
  userId?: string | null;
  emailId?: string | null;
  includes?: Includes.segments;
  segmentNames: string | null;
  segments?: Segments | null;
  method: keyof typeof MethodType;
  outputDir?: string;
  dryRun?: boolean;
  debug?: boolean;
  hideLogs?: boolean;
}
export type State = {
  action: keyof typeof ActionType | null;
  payload: {
    type: keyof typeof PayloadType | null;
    file: string | null;
    userId: string | null;
    emailId: string | null;
    method: keyof typeof MethodType | null;
    segments: Segments | null;
    includes: Includes.segments;
    dryRun: boolean;
    debug: boolean;
    hideLogs: boolean;
    outputDir?: string;
  };
};

/*----------  Segment Utilities  ----------*/

async function registerUserSegments(segments: Segments, userId: string, debug: boolean) {
  const result: any[] = [];
  for await (let segment of segments) {
    const { body }: { body: any } = await got({
      url: `${process.env.USER_SERVICE_HOST}/v1/segments/${segment.id}/users`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
        'x-tenant-id': process.env.FACL_TENANT_ID!,
      },
      responseType: 'json',
      json: {
        data: {
          users: [
            {
              userId,
            },
          ],
        },
      },
    });
    result.push(...body?.data?.users);

    if (debug) {
      logDebug({
        message: 'Debugging postUserSegments',
        data: {
          url: `${process.env.USER_SERVICE_HOST}/v1/segments/${segment.id}/users`,
          userId,
          response: body,
        },
      });
    }
  }
  return result;
}
async function getSegments(): Promise<Segments> {
  const { body }: { body: any } = await got({
    url: makeSegmentsUrl(),
    method: 'GET',
    headers: {
      Authorization: `Bearer ${process.env.AUTH_TOKEN}`,
      'x-tenant-id': process.env.FACL_TENANT_ID!,
    },
    responseType: 'json',
  });
  return normalizeSegments(body?.data?.segments) as Segments;
}
async function filterSegments(segments: string): Promise<Segments | null> {
  const coreSegments = await getSegments();
  const segmentsToRegister = coreSegments?.filter(segment =>
    segments?.split(',')?.includes(segment?.name),
  );

  return segments.split(',').length === segmentsToRegister.length ? segmentsToRegister : null;
}
function normalizeSegments(segments: Record<string, any>): Segments {
  return segments?.map((segment: Segment): Segment => {
    return {
      id: segment?.id,
      name: segment?.name,
    };
  });
}

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

  if (!dryRun) {
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
async function createState(props: Props): Promise<State> {
  const {
    file,
    userId,
    emailId,
    outputDir,
    segmentNames,
    segments,
    method,
    // ! Default Values
    includes = Includes.segments,
    dryRun = false,
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
      // TODO segments son los nombres
      segments: null,
      includes,
      method,
      dryRun,
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
  if (segmentNames) {
    state.payload.segments = await filterSegments(segmentNames);
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
  // TODO refactor to only access the required property
  return !data?.[0]?.userId && !data?.[0]?.emailId && !data?.[0]?.segments.length;
}
// function makeUrl(type: Exclude<PayloadType, PayloadType.file>): string {
//   return type === PayloadType.userId
//     ? `${process.env.USER_SERVICE_HOST}/v1/users/:userId`
//     : `${process.env.USER_SERVICE_HOST}/v1/users?emailId=:emailId`;
// }
function createOutputDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}
function dirExists(dir: string): Boolean {
  return fs.existsSync(dir);
}
function makeSureOutputDirExists(defaultOutputDir: string): void {
  if (!dirExists(defaultOutputDir)) createOutputDir(defaultOutputDir);
}

/*----------  Services  ----------*/

interface UserSegmentsProps extends Omit<Props, 'segmentNames'> {}

const userSegments = async (props: UserSegmentsProps): Promise<void> => {
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
    const outputDir = getDefaultOutputDir();

    makeSureOutputDirExists(outputDir);
    const state = await checkForMissingState(incomingState);

    startLogger({
      instance,
      name: 'userSegment',
      options: { Text: 'Running userSegment...' },
    });

    switch (state.action) {
      case ActionType.getSingleUser:
        return await userSegments({
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
