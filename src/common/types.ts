/*----------  Typescript  ----------*/

export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};
export type NoUndefinedField<T> = { [P in keyof T]-?: NoUndefinedField<NonNullable<T[P]>> };

/*----------  User  ----------*/

export type IncludesType = keyof typeof Includes;
export type Segments = Segment[];
export type Segment = { id: string; name: string };

export enum ActionType {
  getMultipleUsers = 'getMultipleUsers',
  getSingleUser = 'getSingleUser',
}
export enum MethodType {
  get = 'get',
  post = 'post',
}
export enum Includes {
  none = 'none',
  segments = 'segments',
  addresses = 'addresses',
  preferences = 'preferences',
  organizations = 'organizations',
  all = 'preferences,segments,addresses,organizations',
}
export enum FFormant {
  csv = 'csv',
  json = 'json',
}
export enum PayloadType {
  userId = 'userId',
  emailId = 'emailId',
  file = 'file',
}
export enum Confirmation {
  No = 'No',
  Yes = 'Yes',
}

export interface Props {
  action?: keyof typeof ActionType;
  type?: keyof typeof PayloadType;
  file?: string | null;
  userId?: string | null;
  emailId?: string | null;
  includes?: keyof typeof Includes | null;
  segmentNames?: string | null;
  segments?: Segments | null;
  method?: keyof typeof MethodType;
  outputDir?: string;
  dryRun?: boolean;
  debug?: boolean;
  hideLogs?: boolean;
}

export interface State {
  action: keyof typeof ActionType | null;
  payload: Payload;
}

export interface Payload {
  type: keyof typeof PayloadType | null;
  file: string | null;
  userId: string | null;
  emailId: string | null;
  method: keyof typeof MethodType | null;
  segments: Segments | null;
  includes: keyof typeof Includes | null;
  dryRun: boolean;
  debug: boolean;
  hideLogs: boolean;
  outputDir?: string;
}
