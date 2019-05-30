import {
  StoreModule,
  ActionReducerMap,
  MetaReducer,
  createFeatureSelector,
  createSelector
} from '@ngrx/store';
import { Params, RouterStateSnapshot } from '@angular/router';
import { compose } from '@ngrx/store';
import { ActionReducer, combineReducers } from '@ngrx/store';
import { storeFreeze } from 'ngrx-store-freeze';
import { storeLogger } from 'ngrx-store-logger';
import { routerReducer, RouterReducerState, RouterStateSerializer } from '@ngrx/router-store';
import * as fromRouter from '@ngrx/router-store';
import { environment } from 'src/environments/environment';

import * as fromUser from '../user/user.reducer';
import * as fromAuth from './reducers/auth.reducer';

export interface RouterStateUrl {
  url: string;
  params: Params;
  queryParams: Params;
}

const modules = {
  router: routerReducer,
  user: fromUser.userReducer,
  auth: fromAuth.reducer
};

export interface AppState {
  router: fromRouter.RouterReducerState<RouterStateUrl>;
  user: fromUser.UserState;
  auth: fromAuth.AuthState;
}

export const syncReducers = {
  router: routerReducer,
  user: fromUser.userReducer,
  auth: fromAuth.reducer,
};

export const getUserState = createFeatureSelector<fromUser.UserState>('user');

export const getUserLoaded = createSelector(
  getUserState,
  fromUser.getLoaded
);

export class CustomSerializer implements RouterStateSerializer<RouterStateUrl> {
  serialize(routerState: RouterStateSnapshot): RouterStateUrl {
    let route = routerState.root;
    while (route.firstChild) {
      route = route.firstChild;
    }

    const { url, root: { queryParams } } = routerState;
    const { params } = route;

    // Only return an object including the URL, params and query params
    // instead of the entire snapshot
    return { url, params, queryParams };
  }
}


const deepCombineReducers = (allReducers: any) => {
  Object.getOwnPropertyNames(allReducers).forEach((prop) => {
    if (allReducers.hasOwnProperty(prop)
      && allReducers[prop] !== null
      && typeof allReducers[prop] !== 'function') {
      allReducers[prop] = deepCombineReducers(allReducers[prop]);
    }
  });
  return combineReducers(allReducers);
};

const createReducer = (asyncReducers = {}) => {
  const allReducers = { ...syncReducers, ...asyncReducers };
  return deepCombineReducers(allReducers);
};

// Generate a reducer to set the root state in dev mode for HMR
function stateSetter(reducer: ActionReducer<any>): ActionReducer<any> {
  return  (state: any, action: any) => {
    if (action.type === 'SET_ROOT_STATE') {
      return action.payload;
    }
    return reducer(state, action);
  };
}

function logout(reducer: ActionReducer<AppState>): ActionReducer<AppState> {
  return  (state: AppState, action: any): AppState => {
    if (action.type === '[User] Logout Success') {
      state = undefined;
    }
    return reducer(state, action);
  };
}

export function resetOnLogout(reducer: ActionReducer<AppState>): ActionReducer<AppState> {
  return  (state, action) => {
    let newState;
    if (action.type === '[User] Logout Success') {
      newState = Object.assign({}, state);
      Object.keys(modules).forEach((key) => {
        newState[key] = modules[key].initialState;
      });
    }
    return reducer(newState || state, action);
  };
}

export const DEV_REDUCERS: MetaReducer<AppState>[] = [stateSetter, storeFreeze];
// set in constants.js file of project root
if (['logger', 'both'].indexOf(environment.STORE_DEV_TOOLS) !== -1) {
  DEV_REDUCERS.push(storeLogger());
}

/**
 * Auth store functions
 */
export const getAuthState = (state: AppState) => state.auth;
export const getAuthLoaded = createSelector(getAuthState, fromAuth.getLoaded);
export const getAuthLoading = createSelector(getAuthState, fromAuth.getLoading);
export const getAuthFailed = createSelector(getAuthState, fromAuth.getFailed);
export const getLoggedUser = createSelector(
  getAuthState,
  fromAuth.getLoggedUser
);

