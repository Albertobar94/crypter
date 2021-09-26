#!/usr/bin/env node
import { program } from 'commander';
import dotenv from 'dotenv';
import getEnv from './commands/env.command';
import user from './commands/user.command';
import updateOrderId from './commands/orders.command';
import csv from './commands/csv.command';

dotenv.config();

program
  .version('0.10.1')

  .addCommand(getEnv)
  .addCommand(user)
  .addCommand(csv)
  .addCommand(updateOrderId)

  .showHelpAfterError()
  .parse(process.argv);
