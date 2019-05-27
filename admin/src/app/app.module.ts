
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';

import { APP_DECLARATIONS } from './app.declarations';
import { APP_IMPORTS } from './app.imports';
import { APP_PROVIDERS } from './app.providers';

@NgModule({
  declarations: [
    AppComponent,
    APP_DECLARATIONS
  ],
  imports: [APP_IMPORTS],
  providers: [APP_PROVIDERS],
  bootstrap: [AppComponent]
})
export class AppModule { }
