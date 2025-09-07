import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent as AuthRegisterComponent } from './auth/register/register.component';
import { RegisterComponent } from './team/register/register.component';
import { ManagementComponent } from './team/management/management.component';
import { HomeComponent } from './home/home.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, canActivate: [AuthGuard] },
  { path: 'register', component: AuthRegisterComponent, canActivate: [AuthGuard] },
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'team-register', component: RegisterComponent, canActivate: [AuthGuard] },
  { path: 'team-management', component: ManagementComponent, canActivate: [AuthGuard] }
];
