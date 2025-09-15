import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, map, of, switchMap } from 'rxjs';
import { TeamService } from '../services/team.service';
import { UserService } from '../services/user.service';

@Injectable({
  providedIn: 'root'
})
export class TeamCaptainGuard implements CanActivate {

  constructor(
    private teamService: TeamService,
    private userService: UserService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    // Obtener el ID del equipo de los parámetros de la ruta
    const teamId = route.paramMap.get('id');
    
    // Si no hay ID de equipo, redirigir a la página principal
    if (!teamId) {
      this.router.navigate(['/home']);
      return of(false);
    }

    // Verificar si el usuario está autenticado y es capitán del equipo
    return this.userService.userProfile$.pipe(
      switchMap(userProfile => {
        // Si no hay perfil de usuario, redirigir al login
        if (!userProfile) {
          this.router.navigate(['/login']);
          return of(false);
        }

        // Obtener el equipo y verificar si el usuario es capitán
        return this.teamService.getTeamById(teamId).pipe(
          map(team => {
            // Si no existe el equipo, redirigir a la página principal
            if (!team) {
              this.router.navigate(['/home']);
              return false;
            }

            // Verificar si el usuario es capitán del equipo
            const isCaptain = team.captainId === userProfile.uid;
            
            // Si no es capitán, redirigir al perfil del equipo
            if (!isCaptain) {
              this.router.navigate(['/team-profile', teamId]);
            }
            
            return isCaptain;
          })
        );
      })
    );
  }
}