import * as actions from '../actions/auth.action';
import { User } from '../models';

export interface AuthState {
  loading: boolean;
  loaded: boolean;
  failed: boolean;
  user: User;
}

const INITIAL_STATE: AuthState = {
  loading: false,
  loaded: false,
  failed: false,
  user: new User()
};

export function reducer(state = INITIAL_STATE, action: actions.Actions): AuthState {
  if (!action) { return state; }

  switch (action.type) {
    case actions.ActionTypes.DO_LOGIN:
    case actions.ActionTypes.DO_REGISTER:
    case actions.ActionTypes.DO_LOGOUT: {
      return Object.assign({}, state, {
        loading: true,
        loaded: false,
        failed: false
      });
    }

    case actions.ActionTypes.DO_LOGIN_SUCCESS:
    case actions.ActionTypes.DO_REGISTER_SUCCESS: {
      return Object.assign({}, state, {
        loaded: true,
        loading: false,
        failed: false,
        user: action.payload
      });
    }

    case actions.ActionTypes.DO_LOGOUT_SUCCESS: {
      return Object.assign({}, state, INITIAL_STATE);
    }

    case actions.ActionTypes.DO_LOGIN_FAIL:
    case actions.ActionTypes.DO_REGISTER_FAIL:
    case actions.ActionTypes.DO_LOGOUT_FAIL: {
      return Object.assign({}, INITIAL_STATE, { failed: true });
    }

    case actions.ActionTypes.ADD_USER: {
      return Object.assign({}, state, { user: action.payload });
    }

    default: {
      return state;
    }
  }
}

export const getLoggedUser = (state: AuthState) => state.user;
export const getLoading = (state: AuthState) => state.loading;
export const getLoaded = (state: AuthState) => state.loaded;
export const getFailed = (state: AuthState) => state.failed;
