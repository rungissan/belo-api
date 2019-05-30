export enum AsyncActionStatus {
  INIT = 'INIT',
  UNSTARTED = 'UNSTARTED',
  STARTED = 'STARTED',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
}

interface StartedAsyncAction<T> {
  type: T;
  status: AsyncActionStatus.STARTED;
}

interface SucceededAsyncAction<T, P = any> {
  type: T;
  status: AsyncActionStatus.SUCCEEDED;
  payload: P;
}

interface FailedAsyncAction<T> {
  type: T;
  status: AsyncActionStatus.FAILED;
  payload: Error;
}

export type AsyncAction<T, P = any> = StartedAsyncAction<T> |
                                      SucceededAsyncAction<T, P> |
                                      FailedAsyncAction<T>;

function startedAsyncAction<T>(type: T): StartedAsyncAction<T> {
  return {
    type,
    status: AsyncActionStatus.STARTED,
  };
}

function succeededAsyncAction<T, P>(type: T, payload: P): SucceededAsyncAction<T, P> {
  return {
    type,
    status: AsyncActionStatus.SUCCEEDED,
    payload,
  };
}

function failedAsyncAction<T>(type: T, error: Error): FailedAsyncAction<T> {
  return {
    type,
    status: AsyncActionStatus.FAILED,
    payload: error,
  };
}

export function async<T, P>(type: T, action: (...args: any[]) => Promise<P>, ...args: any[]) {
  return async (dispatch: any) => {
    dispatch(startedAsyncAction(type));
    try {
      const payload = await action(...args);
      dispatch(succeededAsyncAction(type, payload));
    } catch (error) {
      dispatch(failedAsyncAction(type, error));
    }
  };
}
