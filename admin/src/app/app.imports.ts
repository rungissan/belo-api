
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppRoutingModule } from './app-routing.module';
import { BrowserModule } from '@angular/platform-browser';
import { SharedModule } from './shared';
import { CoreModule } from './core/core.module';



export const APP_IMPORTS = [
    // angular
    BrowserAnimationsModule,
    BrowserModule,

    // core & shared
    CoreModule,
    SharedModule,

    // features
  //  StaticModule,
   // SettingsModule,

    // app
    AppRoutingModule

];

