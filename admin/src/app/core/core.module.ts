import { NgModule, Optional, SkipSelf } from '@angular/core';


import { CORE_IMPORTS } from './core.imports';
import { CORE_PROVIDERS } from './core.providers';

@NgModule({
  imports: [ CORE_IMPORTS ],
  declarations: [],
  providers: [CORE_PROVIDERS],
  exports: []
})
export class CoreModule {
  constructor(
    @Optional()
    @SkipSelf()
    parentModule: CoreModule
  ) {
    if (parentModule) {
      throw new Error('CoreModule is already loaded. Import only in AppModule');
    }
  }
}

