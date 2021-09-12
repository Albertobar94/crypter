import pino from 'pino';
import cliSpinners from 'cli-spinners';
import consoleClear from 'console-clear';
import Spinnies from 'spinnies';

interface LoggerParams {
  serviceName?: string;
  data?: unknown;
  error?: unknown;
  message: string;
  options?: {};
}

const pinoInfo = ({ serviceName, data, message }: LoggerParams): void => {
  const logger = pino({
    level: 'info',
    prettyPrint: {
      colorize: true, // --colorize
      crlf: true, // --crlf
      errorLikeObjectKeys: ['err', 'error'], // --errorLikeObjectKeys
      levelFirst: true, // --levelFirst
      messageKey: 'message', // --messageKey
      levelKey: 'severity', // --levelKey
      messageFormat: false, // --messageFormat
      timestampKey: 'time', // --timestampKey
      translateTime: true, // --translateTime
      hideObject: false, // --hideObject
      singleLine: false, // --singleLine
    },
  });

  return logger.info({
    severity: 'INFO',
    serviceName,
    data,
    message,
  });
};
const pinoShowData = ({ serviceName, data, message, options }: LoggerParams): void => {
  const logger = pino({
    level: 'info',
    base: undefined,
    prettyPrint: {
      colorize: true, // --colorize
      crlf: true, // --crlf
      levelFirst: true, // --levelFirst
      messageKey: 'message', // --messageKey
      levelKey: 'severity', // --levelKey
      messageFormat: false, // --messageFormat
      translateTime: true, // --translateTime
      hideObject: false, // --hideObject
      singleLine: false, // --singleLine
    },
  });

  return logger.info({
    severity: 'info',
    data,
    message,
  });
};
const pinoError = ({ serviceName, error, message }: LoggerParams): void => {
  const logger = pino({
    level: 'error',
    prettyPrint: {
      colorize: true, // --colorize
      crlf: true, // --crlf
      errorLikeObjectKeys: ['err', 'error'], // --errorLikeObjectKeys
      levelFirst: true, // --levelFirst
      messageKey: 'message', // --messageKey
      levelKey: 'severity', // --levelKey
      messageFormat: false, // --messageFormat
      timestampKey: 'time', // --timestampKey
      translateTime: false, // --translateTime
      hideObject: false, // --hideObject
      singleLine: true, // --singleLine
    },
  });

  return logger.error({
    severity: 'ERROR',
    serviceName,
    error,
    message,
  });
};
const pinoDebug = ({ serviceName, error, data, message }: LoggerParams): void => {
  const logger = pino({
    level: 'debug',
    prettyPrint: {
      colorize: true, // --colorize
      crlf: true, // --crlf
      errorLikeObjectKeys: ['err', 'error'], // --errorLikeObjectKeys
      levelFirst: true, // --levelFirst
      messageKey: 'message', // --messageKey
      levelKey: 'severity', // --levelKey
      messageFormat: false, // --messageFormat
      timestampKey: 'time', // --timestampKey
      translateTime: false, // --translateTime
      hideObject: false, // --hideObject
      singleLine: false, // --singleLine
    },
  });

  return logger.debug({
    severity: 'DEBUG',
    serviceName,
    message,
    error,
    data,
  });
};

const spinnerCreate = () => {
  const spinner = cliSpinners.dots;
  const spinnies = new Spinnies({ succeedColor: 'green', spinner });

  return spinnies;
};
const spinnerStart = ({ instance, name, options }) => {
  instance.add(name, { ...options });
  return instance;
};
const spinnerUpdate = ({ instance, name, options }) => {
  instance.update(name, { ...options });
  return instance;
};
const spinnerFail = ({ instance, name, options }) => {
  instance.fail(name, { ...options });
  return instance;
};
const spinnerSucceed = ({ instance, name, options }) => {
  instance.succeed(name, { ...options });
  return instance;
};

export {
  pinoInfo as logInfo,
  pinoShowData as logData,
  pinoError as logError,
  pinoDebug as logDebug,
  spinnerCreate as createLogger,
  spinnerStart as startLogger,
  spinnerUpdate as updateLogger,
  spinnerFail as failLogger,
  spinnerSucceed as succeedLogger,
};
