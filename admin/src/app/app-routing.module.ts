import { NgModule } from '@angular/core';
import { Routes, RouterModule, PreloadAllModules, NoPreloading } from '@angular/router';


export const routes: Routes = [
//  { path: '', loadChildren: './features/dashboard/dashboard.module#DashboardModule' , pathMatch: 'full' },

{
  path: 'dashboard',
  loadChildren: './dashboard/dashboard.module#DashboardModule',
//    canActivate: [ AuthGuard ]
},
{
  path: '',
  redirectTo: 'dashboard',
  pathMatch: 'full'
//    canActivate: [ AuthGuard ]
},
 { path: '**', loadChildren: './not-found404/index#NotFound404Module' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    useHash: false,
    preloadingStrategy: NoPreloading
  })],
  exports: [RouterModule]
})

export class AppRoutingModule { }
