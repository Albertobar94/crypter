import { Command } from 'commander';
import {
  getUser as getUserService,
  importUser as importUserService,
  deleteUsers as deleteUsersService,
  validateUsers as validateUsersService,
  userSegment as userSegmentService,
} from '../services/user';
import { parseDescription, parseFlags } from '../utils/helpers';
import { bootstrap } from '../utils/bootstrap';

type action =
  | 'get'
  | 'update'
  | 'delete'
  | 'validate'
  | 'import'
  | 'get-segments'
  | 'post-segments';

type CONFIG = {
  command: string;
  description: string;
  options: {
    userId: string;
    userEmail: string;
    includes: 'all' | 'none';
    segments: string;
    debug: boolean;
    dryRun: boolean;
    file: string;
    fileFormat: 'csv' | 'json';
    outputDir: string;
    type: 'userId' | 'emailId';
  };
};

const CONFIG = {
  command: 'user <action>',
  description: `Perform user tasks.

  You can provide a single user as userEmail or userId
  Or instead, you can provide a file to read n amount of userIds or userEmails.

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
    userEmail: ['-e, --userEmail <email>', 'Email of the user in core-user service.'],
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
    type: ['-t, --type', 'Type of query to retrieve the users. Either by userId or emailId.'],
    debug: ['-d, --debug', 'Output debug logs.'],
    dryRun: ['-D, --dryRun', 'Perform a dry run and log the output.'],
  },
};

const {
  command,
  description,
  options: {
    userId,
    userEmail,
    includes,
    segments,
    debug,
    dryRun,
    file,
    fileFormat,
    outputDir,
    type,
  },
} = CONFIG;

const user = new Command()
  .command(command)
  .description(description)

  .option(parseFlags(userId), parseDescription(userId))
  .option(parseFlags(userEmail), parseDescription(userEmail))

  .option(parseFlags(file), parseDescription(file))
  .option(parseFlags(fileFormat), parseDescription(fileFormat))

  .option(parseFlags(outputDir), parseDescription(outputDir))

  .option(parseFlags(type), parseDescription(type))
  .option(parseFlags(includes), parseDescription(includes))
  .option(parseFlags(segments), parseDescription(segments))
  .option(parseFlags(debug), parseDescription(debug))
  .option(parseFlags(dryRun), parseDescription(dryRun))

  .action(async (action: action, options: CONFIG['options']) => {
    await bootstrap();

    const {
      userId,
      userEmail,
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
      case 'get':
        return getUserService({
          userId,
          userEmail,
          includes,
          outputDir,
          fileFormat,
          debug,
        });
      case 'import':
        return importUserService({ file, outputDir });
      case 'delete':
        return deleteUsersService({
          userId,
          userEmail,
          file,
          fileFormat,
          outputDir,
          debug,
          dryRun,
        });
      case 'validate':
        return validateUsersService({
          file,
          fileFormat,
          outputPath: outputDir,
          type: type,
          debug,
          dryRun,
        });
      case 'get-segments':
        return userSegmentService({
          file,
          fileFormat,
          outputDir,
          action: 'get',
          debug,
          userEmail,
        });
      case 'post-segments':
        return userSegmentService({
          file,
          fileFormat,
          outputDir,
          action: 'post',
          segments,
          debug,
          dryRun,
          userEmail,
        });
      default:
        throw new Error(
          'Action must be get | update | delete | validate | import | get-segments | post-segments',
        );
    }
  });

export default user;
