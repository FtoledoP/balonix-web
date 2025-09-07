import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { FirebaseService } from '../services/firebase.service';
import { onAuthStateChanged } from 'firebase/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private firebaseService: FirebaseService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    return new Promise((resolve) => {
      onAuthStateChanged(this.firebaseService.auth, (user) => {
        const isLoggedIn = !!user;
        const isAuthPage = state.url.includes('/login') || state.url.includes('/register');

        if (isLoggedIn && isAuthPage) {
          this.router.navigate(['/home']);
          resolve(false);
        } else if (!isLoggedIn && !isAuthPage) {
          this.router.navigate(['/login']);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }
}
