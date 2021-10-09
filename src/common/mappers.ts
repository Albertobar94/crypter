type TransformType = 'emailId' | 'userId';

type PayloadResponse<T extends TransformType> = {
  readonly payload: T extends 'emailId'
    ? {
        data: {
          [users: string]: Record<string, any>[];
        };
      }
    : {
        data: {
          [user: string]: any;
        };
      };
  metadata?: Record<string, unknown>;
  transformType: TransformType;
};

type ErrorResponse = {
  readonly error: any;
  metadata?: Record<string, unknown>;
  transformType: TransformType;
};

type VResponse =
  | {
      id: string;
      accountId: string;
      emailId: string;
    }
  | {
      statusCode: string;
    }
  | {
      userId: string;
      errorMessage: string;
      statusCode: string;
    }
  | undefined;

// type gTransRes = '[';

type Transformer<T extends TransformType, R> = {
  (props: PayloadResponse<T>): R;
};

type ETransformer<R> = {
  (props: ErrorResponse): R;
};

export const validateTransformer: Transformer<TransformType, VResponse> = ({
  payload,
  metadata,
  transformType,
}) => {
  switch (transformType) {
    case 'emailId':
      return {
        ...metadata,
        id: payload?.data?.users?.[0]?.userId,
        accountId: payload?.data?.users?.[0]?.accountIds[0],
        emailId: payload?.data?.users?.[0]?.email.emailId,
      };
    case 'userId':
      return {
        ...metadata,
        id: payload?.data?.user?.userId,
        accountId: payload?.data?.user?.accountIds[0],
        emailId: payload?.data?.user?.email.emailId,
      };
    default:
      throw new Error('transformType must be specified in transformerCb');
  }
};

export const validateErrorsTransformer: ETransformer<VResponse> = ({
  error,
  metadata,
  transformType,
}) => {
  switch (transformType) {
    case 'emailId':
      return {
        ...metadata,
        statusCode: error?.response?.statusCode || error?.code,
      };
    case 'userId':
      return {
        ...metadata,
        userId: error?.response?.body?.errors?.[0]?.message.split(' ')[3],
        errorMessage: error?.response?.body?.errors?.[0]?.message,
        statusCode: error?.response?.statusCode || error?.code,
      };
    default:
      throw new Error('Type must be specified in validateErrorsTransformer');
  }
};

// TODO refactor this... this is only for emailId type
export const migratedUserTransformer = ({
  payload,
  metadata,
  transformType,
}: PayloadResponse<'emailId' | 'userId'>) => {
  const isMigratedUser = !!payload?.data?.users?.[0]?.iamUserId;

  switch (isMigratedUser) {
    case true:
      return {
        id: payload?.data?.users?.[0]?.userId,
        emailId: payload?.data?.users?.[0]?.email.emailId,
        iamUserId: payload?.data?.users?.[0]?.iamUserId,
        authenticationAgents: payload?.data?.users?.[0]?.authenticationAgents,
      };
    case false:
      return {
        id: payload?.data?.users?.[0]?.userId,
        emailId: payload?.data?.users?.[0]?.email.emailId,
        authenticationAgents: payload?.data?.users?.[0]?.authenticationAgents,
      };
    default:
      throw new Error('isMigratedUser must be a boolean type');
  }
};

export const getUsersTransformer: Transformer<TransformType, Record<string, any>> = ({
  payload,
  metadata,
  transformType,
}) => {
  switch (transformType) {
    case 'emailId':
      return {
        ...metadata,
        id: payload?.data?.users?.[0]?.userId,
        emailId: payload?.data?.users?.[0]?.email.emailId,
        lastLoggedInAt: payload?.data?.users?.[0]?.customInfo.filter(
          e => e?.name === 'lastLoggedInAt',
        )?.[0]?.values,
        passwordLastModifiedAt: payload?.data?.users?.[0]?.customInfo.filter(
          e => e?.name === 'passwordLastModifiedAt',
        )?.[0]?.values,
        createdAt: payload?.data?.users?.[0]?.audit?.createdAt,
      };
    case 'userId':
      return {
        ...metadata,
        id: payload?.data?.user?.userId,
        emailId: payload?.data?.user?.email.emailId,
        lastLoggedInAt: payload?.data?.user.customInfo.filter(
          e => e?.name === 'lastLoggedInAt',
        )?.[0]?.values,
        passwordLastModifiedAt: payload?.data?.user.customInfo.filter(
          e => e?.name === 'passwordLastModifiedAt',
        )?.[0]?.values,
        createdAt: payload?.data?.user?.audit?.createdAt,
      };
    default:
      throw new Error('transformType must be specified in transformerCb');
  }
};

export const getUsersErrorsTransformer: ETransformer<Record<string, any>> = ({
  error,
  metadata,
  transformType,
}) => {
  switch (transformType) {
    case 'emailId':
      return {
        ...metadata,
        statusCode: error?.response?.statusCode || error?.code,
      };
    case 'userId':
      return {
        ...metadata,
        userId: error?.response?.body?.errors?.[0]?.message.split(' ')[3],
        errorMessage: error?.response?.body?.errors?.[0]?.message,
        statusCode: error?.response?.statusCode || error?.code,
      };
    default:
      throw new Error('Type must be specified in validateErrorsTransformer');
  }
};

// TODO
export const transformRecordForUserImport = record => {
  let data = JSON.parse(record.data);
  let { preferences, addresses, user } = data;

  addresses = addresses?.map(address => {
    const addressInfo = address;
    if (addressInfo.postcode && addressInfo.postcode.length) {
      addressInfo.postCode = addressInfo.postcode;
      delete addressInfo.postcode;
    }
    delete addressInfo.name;
    return addressInfo;
  });

  preferences = preferences?.map(preference => {
    const { isMandatory } = preference;
    preference.isMandatory = isMandatory === 'true' ? true : false;
    return preference;
  });

  user.authenticationAgents = user.authenticationAgents.map(authenticationAgent => {
    if (authenticationAgent.name !== 'Default') {
      authenticationAgent.customInfo = authenticationAgent.customInfo.map(info => {
        delete info.mandatory;
        return info;
      });
      return authenticationAgent;
    }
    return authenticationAgent;
  });

  user.userId = record.userId;
  user.accounts[0].accountId = record.accountId;

  // logInfo({
  //   serviceName: 'transformRecordForUserImport',
  //   message: `Parsed Record with id of ${user.userId}`,
  //   data: {
  //     user,
  //     addresses,
  //     preferences,
  //   },
  // });

  return {
    data: {
      user,
      addresses,
      preferences,
    },
  };
};
