import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeamService, Team } from '../../services/team.service';
import { UserService, UserProfile } from '../../services/user.service';
import { Observable, firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-team-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './team-selector.component.html',
  styleUrls: ['./team-selector.component.scss']
})
export class TeamSelectorComponent {
  teams$: Observable<Team[]>;
  userProfile$: Observable<UserProfile | null>;
  
  constructor(
    private teamService: TeamService,
    private userService: UserService
  ) {
    this.teams$ = this.teamService.teams$;
    this.userProfile$ = this.userService.userProfile$;
  }

  async onTeamSelectionChange(event: Event): Promise<void> {
    const selectedTeamId = (event.target as HTMLSelectElement).value;
    const profile = await firstValueFrom(this.userProfile$);
    if (profile) {
      this.teamService.updateActiveTeam(profile.uid, selectedTeamId);
    }
  }
}
