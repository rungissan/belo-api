import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { NotFound404Component } from './not-found404.component';

export const routes: Routes = [
  {
    path: '',
    component: NotFound404Component
  }
];

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(routes),
        ],

    declarations: [NotFound404Component],
    providers: [
    ]
})

export class NotFound404Module { }
