import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MaterialModule } from './material.module';


@NgModule({
  imports: [
    MaterialModule,
    FlexLayoutModule
  ],
  declarations: [],
  exports: [
    MaterialModule,
    FlexLayoutModule
  ]
})
export class SharedModule {}
