import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PostRoutingModule } from './post-routing.module';
import { PostComponent } from './post.component';
import { AgGridModule } from 'ag-grid-angular';


@NgModule({
    imports: [CommonModule, PostRoutingModule, AgGridModule.withComponents([])],
    declarations: [PostComponent],
    providers: []
})

export class PostModule {}
