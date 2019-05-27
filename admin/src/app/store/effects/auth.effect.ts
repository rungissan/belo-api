import { map, catchError, switchMap} from 'rxjs/operators';
import { Observable, of } from 'rxjs';


import { Injectable } from '@angular/core';
import { Effect, Actions, ofType } from '@ngrx/effects';
import { Action } from '@ngrx/store';

// import { AuthApiClient } from '../../../auth/authApiClient.service';
import * as actions from '../actions/auth.action';
import { Store } from '@ngrx/store';
import * as store from '..';
import { User } from '../models';

/**
 * Effects offer a way to isolate and easily test side-effects within your
 * application. StateUpdates is an observable of the latest state and
 * dispatched action. The `toPayload` helper function returns just
 * the payload of the currently dispatched action, useful in
 * instances where the current state is not necessary.
 *
 * If you are unfamiliar with the operators being used in these examples, please
 * check out the sources below:
 *
 * Official Docs: http://reactivex.io/rxjs/manual/overview.html#categories-of-operators
 * RxJS 6 Operators By Example: https://gist.github.com/btroncone/d6cf141d6f2c00dc6b35
 */

@Injectable()
export class AuthEffects {
  constructor(
    private actions$: Actions,
  //  private authApiClient: AuthApiClient,
    private appState$: Store<store.AppState>
  ) { }

  /**
   * Login effect
   */
  @Effect()
  doLogin$: Observable<Action> = this.actions$
    .pipe(
      ofType(actions.ActionTypes.DO_LOGIN),
      map((action: actions.DoLoginAction) => action.payload),
      switchMap(state => {
        return null;
        // this.authApiClient
        //   .login(state)
        //   .pipe(
        //     map(user => new actions.DoLoginSuccessAction(new User(user))),
        //     catchError(() => of(new actions.DoLoginFailAction()))
        //   );
      })
    );

  /**
   * Registers effect
   */
  @Effect()
  doRegister$: Observable<Action> = this.actions$
    .pipe(
      ofType(actions.ActionTypes.DO_REGISTER),
      map((action: actions.DoRegisterAction) => action.payload),
      switchMap(state => {
        return null;
        // this.authApiClient
        //   .register(state)
        //   .pipe(
        //     map(user => new actions.DoRegisterSuccessAction(new User(user))),
        //     catchError(() => of(new actions.DoRegisterFailAction()))
        //   );
      })
    );

  /**
   * Logout effect
   */
  @Effect()
  doLogout$: Observable<Action> = this.actions$
    .pipe(
      ofType(actions.ActionTypes.DO_LOGOUT),
      map((action: actions.DoLogoutAction) => null),
      switchMap(state => {
        return null;
        // this.authApiClient
        //   .logout()
        //   .pipe(
        //     map(() => new actions.DoLogoutSuccessAction()),
        //     catchError(() => of(new actions.DoLogoutFailAction()))
        //   );
      })
    );
}
