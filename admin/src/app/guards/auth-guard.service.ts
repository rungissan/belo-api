import { Injectable } from '@angular/core';
import {
  CanActivate,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot
} from '@angular/router';

@Injectable()
export class AuthGuardService implements CanActivate {
  constructor(private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    return this.checkLogin(state.url);
  }

  checkLogin(url: string): boolean {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) { return true; }

    // Navigate to the login page with extras
    this.router.navigate(['/login']);
    return false;
  }
}
