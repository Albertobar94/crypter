#!/usr/bin/env node
import { program } from 'commander';
import dotenv from 'dotenv';
import getEnv from './commands/env';
import user from './commands/user';
import csv from './commands/csv';

dotenv.config();

program
  .version('0.10.1')

  .addCommand(getEnv)
  .addCommand(user)
  .addCommand(csv)

  .showHelpAfterError()
  .parse(process.argv);
