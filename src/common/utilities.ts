import fs from 'fs';
import got from 'got/dist/source';
import { logDebug } from '../utils/logging';
import { makeSegmentsUrl } from './helpers';
import { PayloadType, Segment, Segments } from './types';

/*----------  Directories  ----------*/

export function getDefaultOutputDir(): string {
  return `${process.env.DEFAULT_OUTPUT_DIR}`;
}
export function createOutputDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}
export function dirExists(dir: string): Boolean {
  return fs.existsSync(dir);
}
export function makeSureOutputDirExists(defaultOutputDir: string): void {
  if (!dirExists(defaultOutputDir)) createOutputDir(defaultOutputDir);
}

/*----------    ----------*/

// TODO remove this
export function makeUrl(type: Exclude<PayloadType, PayloadType.file>): string {
  return type === PayloadType.userId
    ? `${process.env.USER_SERVICE_HOST}/v1/users/:userId`
    : `${process.env.USER_SERVICE_HOST}/v1/users?emailId=:emailId`;
}

/*----------  Segments  ----------*/

export async function filterSegments(segments: string): Promise<Segments | null> {
  const coreSegments = await getSegments();
  const segmentsToRegister = coreSegments?.filter(segment =>
    segments?.split(',')?.includes(segment?.name),
  );

  return segments.split(',').length === segmentsToRegister.length ? segmentsToRegister : null;
}
export async function registerUserSegments(segments: Segments, userId: string, debug: boolean) {
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
export async function getSegments(): Promise<Segments> {
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
export function normalizeSegments(segments: Record<string, any>): Segments {
  return segments?.map((segment: Segment): Segment => {
    return {
      id: segment?.id,
      name: segment?.name,
    };
  });
}
