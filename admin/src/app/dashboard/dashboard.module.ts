import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { routes } from './dashboard.routing';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../shared';

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(routes),
        ReactiveFormsModule,
        SharedModule
        ],

    declarations: [ DashboardComponent],
    providers: [
    ]
})

export class DashboardModule { }
