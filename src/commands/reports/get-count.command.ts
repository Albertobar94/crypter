import { Command } from 'commander';
import { readFile, writeFile } from '../../utils/io';

const reduceFileToIps = (data: any) => {
  return data.reduce((accum: any, log: any) => {
    const ip = log.jsonPayload.httpHeaders
      ? log.jsonPayload.httpHeaders['x-forwarded-for'].split(',')[0]
      : null;
    if (!ip) {
      const traceId = log.jsonPayload.traceHeaders['x-b3-traceid'];
      return {
        ...accum,
        report: {
          ...accum.report,
          [traceId]: log,
        },
      };
    }
    if (ip in accum) {
      const otherLogs = accum[ip];
      return {
        ...accum,
        [ip]: {
          count: otherLogs.data.length + 1,
          data: [...otherLogs.data, log.jsonPayload.traceHeaders],
        },
      };
    }
    return {
      ...accum,
      [ip]: {
        count: 1,
        data: [log.jsonPayload.traceHeaders],
      },
    };
  }, {});
};

const reduceFileToJWTs = (data: any) => {
  return data.reduce((accum: any, log: any) => {
    const jwt = log.jsonPayload.message;
    return {
      ...accum,
      [jwt]: {
        count: accum[jwt]?.count + 1 || 1,
      },
    };
  }, {});
};

const orderAmountOfCalls = (data: any) => {
  return Object.keys(data).reduce(
    (accum: any, payload: any) => {
      if (payload === 'report') {
        return {
          ...accum,
          report: data[payload],
        };
      }
      if (data[payload].count > 49) {
        return {
          ...accum,
          moreThan50: {
            ...accum.moreThan50,
            [payload]: data[payload],
          },
        };
      } else if (data[payload].count > 24) {
        return {
          ...accum,
          moreThan25: {
            ...accum.moreThan25,
            [payload]: data[payload],
          },
        };
      } else if (data[payload].count > 9) {
        return {
          ...accum,
          moreThan10: {
            ...accum.moreThan10,
            [payload]: data[payload],
          },
        };
      } else if (data[payload].count > 3) {
        return {
          ...accum,
          moreThan4: { ...accum.moreThan4, [payload]: data[payload] },
        };
      } else if (data[payload].count <= 3) {
        return {
          ...accum,
          lessThan4: { ...accum.lessThan4, [payload]: data[payload] },
        };
      } else {
        console.error(payload);
      }
    },
    {
      moreThan50: {},
      moreThan25: {},
      moreThan10: {},
      moreThan4: {},
      lessThan4: {},
    },
  );
};

const orderCountForJwts = (data: any) => {
  return Object.keys(data).reduce(
    (accum: any, payload: any) => {
      if (payload === data[0]?.message) console.log(payload);
      if (data[payload].count > 19) {
        return {
          ...accum,
          _20_AND_OVER: {
            ...accum?._20_AND_OVER,
            [payload.message]: data.count,
          },
        };
      } else if (data[payload].count > 9) {
        return {
          ...accum,
          _10_AND_OVER: {
            ...accum?._10_AND_OVER,
            [payload.message]: data.count,
          },
        };
      } else if (data[payload].count > 4) {
        return {
          ...accum,
          _5_AND_OVER: {
            ...accum?._5_AND_OVER,
            [payload.message]: data.count,
          },
        };
      } else if (data[payload].count <= 3) {
        return {
          ...accum,
          _5_AND_LOWER: {
            ...accum?._5_AND_LOWER,
            [payload.message]: data.count,
          },
        };
      } else {
        console.error(payload);
      }
    },
    {
      _20_AND_OVER: {},
      _10_AND_OVER: {},
      _5_AND_OVER: {},
      _5_AND_LOWER: {},
    },
  );
};

const getCountForIps = async (file: string, out?: string) => {
  const data = await JSON.parse((await readFile({ file })) as string);
  const ips = reduceFileToIps(data);
  if (out) {
    const orderedData: string = orderAmountOfCalls(ips);
    return writeFile({
      outputFile: out,
      content: orderedData,
      parser: 'json',
    });
  } else {
    return console.log('NOT OUT', ips);
  }
};

const getCountForJwt = async (file: string, out?: any) => {
  try {
    const data = await JSON.parse((await readFile({ file, parser: 'json' })) as string);
    const jwts = reduceFileToJWTs(data);
    console.log(jwts);
  } catch (error) {
    console.log(error);
  }
};

const getCount = new Command()
  .command('get-count')
  .description('Get count for info')
  .option('-f, --file <file>', 'Read File')
  .option('-o, --out <path>', 'Output data to path')
  .option('-ip, --ips', 'Get count for ips')
  .option('-jwt, --jwt', 'Get count for jwt tokens')
  .action(async options => {
    if (options.file && options.out && options.ips) await getCountForIps(options.file, options.out);
    if (options.file && options.ips) await getCountForIps(options.file);
    if (options.file && options.out && options.jwt) await getCountForJwt(options.file, options.out);
    if (options.file && options.jwt) await getCountForJwt(options.file);
  });

export default getCount;
