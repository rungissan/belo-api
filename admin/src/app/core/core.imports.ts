
import { EffectsModule } from '@ngrx/effects';
import { StoreRouterConnectingModule } from '@ngrx/router-store';
import { StoreModule, MetaReducer } from '@ngrx/store';

import { DEV_REDUCERS, syncReducers, resetOnLogout, AppState } from '../store';
import { RouterEffects } from '../store/effects/router.effect';
import { UserEffects } from '../user/user.effects';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';


export const metaReducers: MetaReducer<AppState>[] = !environment.production ?
  [...DEV_REDUCERS, resetOnLogout] : [resetOnLogout];

export const CORE_IMPORTS = [
  HttpClientModule,
  EffectsModule.forRoot([
    RouterEffects,
    UserEffects
    ]),
  StoreModule.forRoot(syncReducers, { metaReducers }),
  StoreRouterConnectingModule.forRoot({
    stateKey: 'router'
  }),

];



