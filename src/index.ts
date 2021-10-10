#!/usr/bin/env node
import { program } from 'commander';
import getEnv from './commands/env';
import user from './commands/user';
import csv from './commands/csv';

program
  .version('1.0.1')

  .addCommand(getEnv)
  .addCommand(user)
  .addCommand(csv)

  .showHelpAfterError()
  .parse(process.argv);
