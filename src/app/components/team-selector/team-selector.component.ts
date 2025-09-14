import { Component, EventEmitter, Output, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TeamService, Team } from '../../services/team.service';
import { UserService, UserProfile } from '../../services/user.service';
import { Observable, firstValueFrom, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { TeamSelectorModalComponent } from '../team-selector-modal/team-selector-modal.component';

@Component({
  selector: 'app-team-selector',
  standalone: true,
  imports: [CommonModule, TeamSelectorModalComponent],
  templateUrl: './team-selector.component.html',
  styleUrls: ['./team-selector.component.scss']
})
export class TeamSelectorComponent implements OnInit, OnDestroy {
  teams$: Observable<Team[]>;
  userProfile$: Observable<UserProfile | null>;
  activeTeam$: Observable<Team | null>;
  
  showModal = false;
  private subscriptions: Subscription[] = [];
  
  @Output() createTeamRequest = new EventEmitter<void>();
  
  constructor(
    private teamService: TeamService,
    private userService: UserService,
    private router: Router
  ) {
    this.teams$ = this.teamService.teams$;
    this.userProfile$ = this.userService.userProfile$;
    this.activeTeam$ = this.teamService.activeTeam$;
  }
  
  ngOnInit(): void {
    // Cualquier inicialización adicional si es necesaria
  }
  
  ngOnDestroy(): void {
    // Limpiar suscripciones
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  createTeam(): void {
    this.createTeamRequest.emit();
  }
  
  openTeamSelector(): void {
    // Siempre mostrar el selector de equipos cuando se hace clic en el equipo activo
    this.showModal = true;
  }

  navigateToTeamProfile(teamId: string): void {
    this.router.navigate(['/team-profile', teamId]);
  }
  
  closeModal(): void {
    this.showModal = false;
  }
  
  selectTeam(team: Team): void {
    // Obtenemos el perfil de usuario actual desde el observable
    this.userProfile$.pipe(take(1)).subscribe(userProfile => {
      if (userProfile) {
        this.teamService.updateActiveTeam(userProfile.uid, team.id);
      }
      this.closeModal();
    });
  }
  
  getTeamInitials(teamName: string): string {
    if (!teamName) return '';
    
    // Dividir el nombre por espacios y tomar la primera letra de cada palabra
    const words = teamName.split(' ');
    if (words.length === 1) {
      // Si solo hay una palabra, tomar las dos primeras letras
      return teamName.substring(0, 2).toUpperCase();
    } else {
      // Si hay múltiples palabras, tomar la primera letra de las dos primeras palabras
      return (words[0][0] + words[1][0]).toUpperCase();
    }
  }
  
  // Se han eliminado los métodos relacionados con el menú desplegable
}
