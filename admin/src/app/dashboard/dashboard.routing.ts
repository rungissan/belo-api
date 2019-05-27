import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard.component';

export const routes: Routes = [
  {
      path: '',
      component: DashboardComponent,
      children: [
        //  { path: 'home', redirectTo: 'events/alarms' },  , canActivate: [ AuthGuard ]
          { path: 'home', loadChildren: './home/home.module#HomeModule' },
          { path: 'posts', loadChildren: './posts/post.module#PostModule' },
          { path: 'lazy', loadChildren: '../lazy/index#LazyModule' },
          // {
          //     path: 'dictionaries',
          //     loadChildren:
          //         './dictionaries/dictionaries.module#DictionariesModule'
          // },
          // {
          //     path: 'charts',
          //     loadChildren: './charts/charts.module#ChartsModule'
          // },
          // {
          //     path: 'invoice',
          //     loadChildren: './invoice/invoice.module#InvoiceModule'
          // },
          // {
          //     path: 'profile',
          //     loadChildren: './profile/profile.module#ProfileModule'
          // },
          // {
          //     path: 'events',
          //     loadChildren: './events/events.module#EventsModule'
          // },
          // { path: 'maps', loadChildren: './maps/maps.module#MapsModule' }
      ]
  }
];

