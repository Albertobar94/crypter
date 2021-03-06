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
import { MethodType, userAction, UserAction, UserConfig } from '../common/types';

/*----------  Utilities  ----------*/

function getCommand(cm: UserAction) {
  return userAction[cm];
}

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
    segmentNames: [
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
    segmentNames,
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
  .option(parseFlags(segmentNames), parseDescription(segmentNames))
  .option(parseFlags(debug), parseDescription(debug))
  .option(parseFlags(dryRun), parseDescription(dryRun))
  .action(async (action: UserAction, options: UserConfig['options']) => {
    await bootstrap();

    const {
      userId,
      emailId,
      includes,
      segmentNames,
      debug,
      dryRun,
      file,
      fileFormat,
      outputDir,
      type,
    } = options;

    switch (action) {
      case getCommand('get'):
        await getUserService({
          file,
          userId,
          emailId,
          includes,
          outputDir,
          debug,
        });
        return;
      case getCommand('update'):
        await importUserService({ file, outputDir });
        return;
      case getCommand('delete'):
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
      case getCommand('validate'):
        await validateUsersService({
          file,
          fileFormat,
          outputPath: outputDir,
          type,
          debug,
          dryRun,
        });
        return;
      case getCommand('get-segments'):
        await userSegmentService({
          file,
          emailId,
          segmentNames,
          method: MethodType.get,
          outputDir,
          debug,
        });
        return;
      case getCommand('post-segments'):
        await userSegmentService({
          file,
          outputDir,
          segmentNames,
          method: MethodType.post,
          debug,
          dryRun,
          emailId,
        });
        return;
      default:
        throw new Error(`${'Action must be either ' + Object.keys(userAction).join(' | ')}`);
    }
  });

export default user;
