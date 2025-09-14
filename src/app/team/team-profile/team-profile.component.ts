import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TeamService, Team, TeamMember } from '../../services/team.service';
import { UserService, UserProfile } from '../../services/user.service';
import { Observable, Subscription, of, switchMap, map, tap } from 'rxjs';

@Component({
  selector: 'app-team-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './team-profile.component.html',
  styleUrl: './team-profile.component.scss'
})
export class TeamProfileComponent implements OnInit, OnDestroy {
  team$: Observable<Team | null> = of(null);
  teamMembers$: Observable<TeamMember[]> = of([]);
  userProfile$: Observable<UserProfile | null>;
  isTeamCaptain$: Observable<boolean> = of(false);
  private subscriptions: Subscription[] = [];
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private teamService: TeamService,
    private userService: UserService
  ) {
    this.userProfile$ = this.userService.userProfile$;
  }
  
  ngOnInit(): void {
    // Obtener el ID del equipo de la URL
    this.team$ = this.route.paramMap.pipe(
      switchMap(params => {
        const teamId = params.get('id');
        if (!teamId) {
          this.router.navigate(['/team-management']);
          return of(null);
        }
        // Obtener miembros cuando tenemos el teamId
        this.teamMembers$ = this.teamService.getTeamMembers(teamId);
        return this.teamService.getTeamById(teamId);
      })
    );
    
    // Determinar si el usuario actual es el capitán del equipo
    this.isTeamCaptain$ = this.team$.pipe(
      switchMap(team => {
        if (!team) return of(false);
        
        return this.userProfile$.pipe(
          map(userProfile => {
            if (!userProfile) return false;
            return team.captainId === userProfile.uid;
          })
        );
      })
    );
  }
  
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  
  navigateToEditTeam(teamId: string): void {
    this.router.navigate(['/team-management/edit', teamId]);
  }

  getScheduleDays(schedule: Team['schedule']): string[] {
    if (!schedule) {
      return [];
    }

    const daysOrder = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    
    const availableDays = Object.keys(schedule).filter(day => schedule[day] !== null);
    
    return availableDays.sort((a, b) => daysOrder.indexOf(a) - daysOrder.indexOf(b));
  }
}
