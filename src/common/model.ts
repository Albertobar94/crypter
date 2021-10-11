import { ActionType, DeepPartial, Payload, PayloadType, Props, State } from './types';
import { filterSegments } from './utilities';

export async function createState(props: Props): Promise<State> {
  const {
    file,
    userId,
    emailId,
    outputDir,
    includes,
    method,
    segmentNames,
    dryRun = false,
    debug = false,
    hideLogs = false,
  } = props;
  const state: State = {
    action: null,
    payload: {
      type: null,
      file: null,
      userId: null,
      emailId: null,
      segments: null,
      includes: includes ?? null,
      method: method ?? null,
      dryRun,
      debug,
      hideLogs,
      outputDir,
    },
  };

  if (userId) {
    state.action = ActionType.getSingleUser;
    state.payload.type = PayloadType.userId;
    state.payload.userId = userId;
  }
  if (emailId) {
    state.action = ActionType.getSingleUser;
    state.payload.type = PayloadType.emailId;
    state.payload.emailId = emailId;
  }
  if (file) {
    state.action = ActionType.getMultipleUsers;
    state.payload.type = PayloadType.file;
    state.payload.file = file;
  }
  if (segmentNames) {
    state.payload.segments = await filterSegments(segmentNames);
  }

  return state;
}
export function mutateState(state: State, newState: DeepPartial<State>): void {
  (state.action = newState.action ?? state.action),
    (state.payload = {
      ...state.payload,
      ...(newState.payload as State['payload']),
    });
}
