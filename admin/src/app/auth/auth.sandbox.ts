import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';

import * as store from 'src/app/store';
import * as authActions from 'src/app/store/actions/auth.action';
import * as routerActions from 'src/app/store/actions/router.action';
import { User } from 'src/app/store/models';

import { LoginForm, RegisterForm } from 'src/app/store/models';
import { ValidationService } from 'src/app/core/validaton/validation.service';

@Injectable()
export class AuthSandbox {

  constructor(
    private router: Router,
    protected appState$: Store<store.AppState>,
    //  private utilService: UtilService,
    public validationService: ValidationService
  ) {
     this.registerAuthEvents();
  }
  public loginLoading$ = this.appState$.select(store.getAuthLoading);
  public loginLoaded$ = this.appState$.select(store.getAuthLoaded);
  public loggedUser$ = this.appState$.select(store.getLoggedUser);

  private subscriptions: Array<Subscription> = [];

  // /**
  //  * Uncapitalize response keys
  //  */
  // static authAdapter(user: any): any {
  //   return Object.assign({}, user, { email: user.Email });
  // }

  /**
   * Dispatches login action
   */
  public login(form: any): void {
    this.appState$.dispatch(new authActions.DoLoginAction(new LoginForm(form)));
  }


  public go(route: string): void {
    this.appState$.dispatch(new routerActions.Go({path: [route]}));
  }

  /**
   * Dispatches register action
   */
  public register(form: any): void {
    this.appState$.dispatch(
      new authActions.DoRegisterAction(new RegisterForm(form))
    );
  }

  /**
   * Unsubscribe from events
   */
  public unregisterEvents() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Registers events
   */
  private registerAuthEvents(): void {
    // Subscribes to login success event and redirects user to home page
    this.subscriptions.push(
      this.loginLoaded$.subscribe((loaded: boolean) => {
        if (loaded) { this.router.navigate(['/products']); }
      })
    );

    // Subscribes to logged user data and save/remove it from the local storage
    this.subscriptions.push(
      this.loggedUser$.subscribe((user: User) => {
        if (user.isLoggedIn) { user.save(); } else { user.remove(); }
      })
    );
  }


  public loadUser(): void {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    this.appState$.dispatch(new authActions.AddUserAction(new User(user)));
  }
}
