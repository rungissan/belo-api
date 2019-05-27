import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store, select } from '@ngrx/store';

import { views } from './app-nav-views';
import { MOBILE } from './services/constants';

import * as fromRoot from './store';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-root',
  styleUrls: ['main.scss', './app.component.scss'],
  templateUrl: './app.component.html',
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit {
  mobile = MOBILE;
  sideNavMode = MOBILE ? 'over' : 'side';
  views = views;

  constructor(
    public route: ActivatedRoute,
    public router: Router,
    public store: Store<fromRoot.AppState>
  ) { }

  ngOnInit() {
 //   this.cache.set('cached', true);
    const a = this.store.pipe(select(fromRoot.getUserLoaded));
    a.subscribe(l => console.log(l));
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
}
