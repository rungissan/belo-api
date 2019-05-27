import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

import { AppState } from '../store';
import { Store } from '@ngrx/store';
import { User } from '../user/user.model';

import * as UserActions from '../user/user.actions';
import { MOBILE } from 'src/app/services/constants';
import { views } from 'src/app/app-nav-views';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  styleUrls: ['../main.scss', './dashboard.component.scss'],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './dashboard.component.html'
 })

export class DashboardComponent implements OnDestroy, OnInit {
  mobile = MOBILE;
  sideNavMode = MOBILE ? 'over' : 'side';
  views = views;
  destroyed$: Subject<any> = new Subject<any>();
  form: FormGroup;
  nameLabel = 'Enter your name';
  testSub$: Observable<string>;
  user: User;
  user$: Observable<User>;
  constructor(
    private fb: FormBuilder,
    private router: Router,
  //  private http: TransferHttp,
    private store: Store<AppState>
  ) {
    this.form = fb.group({
      name: ''
    });
    this.user$ = this.store.select(state => state.user.user);
    this.user$.pipe(takeUntil(this.destroyed$))
      .subscribe(user => { this.user = user; });
  }

  ngOnInit() {
    this.form.get('name').setValue(this.user.name);
    if (this.router.url === '/home' || this.router.url === '') {
      this.router.navigate(['home']);
  }

  }

  activateEvent(event) {
    if (environment.production) {
      console.log('Activate Event:', event);
    }
  }

  deactivateEvent(event) {
    if (!environment.production) {
      console.log('Deactivate Event', event);
    }
  }

  clearName() {
    this.store.dispatch(new UserActions.EditUser(
      Object.assign({}, this.user, { name: '' }
      )));

    this.form.get('name').setValue('');
  }

  logout() {
    this.store.dispatch(new UserActions.Logout());
  }

  submitState() {
    this.store.dispatch(new UserActions.EditUser(
      Object.assign({}, this.user, { name: this.form.get('name').value }
      )));
  }

  ngOnDestroy() {
    this.destroyed$.next();
  }
}
