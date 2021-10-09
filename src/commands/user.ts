import { Command } from 'commander';
import {
  getUser as getUserService,
  importUser as importUserService,
  deleteUsers as deleteUsersService,
  validateUsers as validateUsersService,
  userSegment as userSegmentService,
} from '../services/user';
import { parseDescription, parseFlags } from '../common/helpers';
import { bootstrap } from '../utils/bootstrap';
import { FFormant, IncludesType } from '../common/types';
import { MethodType } from '../services/user/segments.service';

/*----------  Types  ----------*/

type ActionType = keyof typeof Action;
const Action = {
  get: 'get',
  update: 'update',
  delete: 'delete',
  validate: 'validate',
  import: 'import',
  'get-Segments': 'get-segments',
  'post-Segments': 'post-segments',
};
type Config = {
  command: ActionType;
  description: string;
  options: {
    userId: string;
    emailId: string;
    file: string;
    includes: IncludesType;
    segments: string;
    debug: boolean;
    dryRun: boolean;
    fileFormat: FFormant;
    outputDir: string;
    type: 'userId' | 'emailId';
  };
};

/*----------  Config  ----------*/

const config = {
  command: 'user <action>',
  description: `Perform user tasks.

  You can provide a single user as emailId or userId
  Or instead, you can provide a file to read n amount of userIds or emailIds.

  ** Alert **
  the columns in the csv file to read must be named same as in core-user service, as following:
  - userId,emailId,accountId

  ** Minimum Requirements to run **
  - get : You must provide a userId or emailId
  - delete : You must provide a userId or a emailId and confirm the action.

  ** Debugging **
  Only need to add the -d or --debug flag


  Action available -> get | update | delete | validate | get-segments | post-segments.
  `,
  options: {
    userId: ['-i, --userId <id>', 'Id of the user in core-user service.'],
    emailId: ['-e, --emailId <email>', 'Email of the user in core-user service.'],
    includes: [
      '-I, --includes <values>',
      'Includes param to add to the url, the value is in a string separated by ",".',
    ],
    segments: [
      '-s, --segments <values>',
      'Segments names to add to a user, the value is in a string separated by ",".',
    ],
    file: ['-f, --file <path> ', 'File path to read.'],
    fileFormat: ['-F, --fileFormat <format> ', 'Format of the file to read.'],
    outputDir: ['-o, --outputDir <path>', 'Path to the desired output directory.'],
    type: [
      '-t, --type <value>',
      'Type of query to retrieve the users. Either by userId or emailId.',
    ],
    debug: ['-d, --debug', 'Output debug logs.'],
    dryRun: ['-D, --dryRun', 'Perform a dry run and log the output.'],
  },
};
const {
  command,
  description,
  options: {
    userId,
    emailId,
    includes,
    segments,
    debug,
    dryRun,
    file,
    fileFormat,
    outputDir,
    type,
  },
} = config;

/*----------  Command  ----------*/

const user = new Command()
  .command(command)
  .description(description)
  .option(parseFlags(userId), parseDescription(userId))
  .option(parseFlags(emailId), parseDescription(emailId))
  .option(parseFlags(file), parseDescription(file))
  .option(parseFlags(fileFormat), parseDescription(fileFormat))
  .option(parseFlags(outputDir), parseDescription(outputDir))
  .option(parseFlags(type), parseDescription(type))
  .option(parseFlags(includes), parseDescription(includes))
  .option(parseFlags(segments), parseDescription(segments))
  .option(parseFlags(debug), parseDescription(debug))
  .option(parseFlags(dryRun), parseDescription(dryRun))
  .action(async (action: ActionType, options: Config['options']) => {
    await bootstrap();

    const {
      userId,
      emailId,
      includes,
      segments,
      debug,
      dryRun,
      file,
      fileFormat,
      outputDir,
      type,
    } = options;

    switch (action) {
      case Action.get:
        await getUserService({
          file,
          userId,
          emailId,
          includes,
          outputDir,
          debug,
        });
        return;
      case Action.update:
        await importUserService({ file, outputDir });
        return;
      case Action.delete:
        await deleteUsersService({
          userId,
          emailId,
          file,
          fileFormat,
          outputDir,
          debug,
          dryRun,
        });
        return;
      case Action.validate:
        await validateUsersService({
          file,
          fileFormat,
          outputPath: outputDir,
          type,
          debug,
          dryRun,
        });
        return;
      case Action['get-Segments']:
        await userSegmentService({
          file,
          emailId,
          segmentNames: segments,
          method: MethodType.get,
          outputDir,
          debug,
        });
        return;
      case Action['post-Segments']:
        await userSegmentService({
          file,
          outputDir,
          segmentNames: segments,
          method: MethodType.post,
          debug,
          dryRun,
          emailId,
        });
        return;
      default:
        throw new Error(`Action must be ${Object.keys(Action).join(' | ')}`);
    }
  });

export default user;
