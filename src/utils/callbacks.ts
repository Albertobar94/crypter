interface DataProps {
  payload?: any;
  responseBody?: any;
  transformType?: 'userId' | 'emailId';
}
interface ErrorProps {
  error?: any;
  transformType?: 'userId' | 'emailId';
}

export const validateTransformer = ({ payload, transformType }: DataProps) => {
  switch (transformType) {
    case 'emailId':
      return {
        id: payload?.data?.users?.[0]?.userId,
        accountId: payload?.data?.users?.[0]?.accountIds[0],
        emailId: payload?.data?.users?.[0]?.email.emailId,
      };
    case 'userId':
      return {
        id: payload?.data?.user?.userId,
        accountId: payload?.data?.user?.accountIds[0],
        emailId: payload?.data?.user?.email.emailId,
      };
    default:
      throw new Error('Type must be specified in transformerCb');
  }
};

// TODO refactor this... this is only for emailId type
export const migratedUserTransformer = ({ payload, transformType }: DataProps) => {
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

export const validateErrorsTransformer = ({ error, transformType }: ErrorProps) => {
  switch (transformType) {
    case 'emailId':
      return {
        statusCode: error?.response?.statusCode || error?.code,
      };
    case 'userId':
      return {
        userId: error?.response?.body?.errors?.[0]?.message.split(' ')[3],
        errorMessage: error?.response?.body?.errors?.[0]?.message,
        statusCode: error?.response?.statusCode || error?.code,
      };
    default:
      throw new Error('Type must be specified in validateErrorsTransformer');
  }
};
