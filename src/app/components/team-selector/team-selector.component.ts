import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeamService, Team } from '../../services/team.service';
import { UserService, UserProfile } from '../../services/user.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-team-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './team-selector.component.html',
  styleUrls: ['./team-selector.component.scss']
})
export class TeamSelectorComponent implements OnInit {
  teams$: Observable<Team[]>;
  userProfile$: Observable<UserProfile | null>;
  
  constructor(
    private teamService: TeamService,
    private userService: UserService
  ) {
    this.teams$ = this.teamService.teams$;
    this.userProfile$ = this.userService.userProfile$;
  }

  ngOnInit(): void {}

  onTeamSelectionChange(event: Event): void {
    const selectedTeamId = (event.target as HTMLSelectElement).value;
    this.userProfile$.subscribe(profile => {
      console.log('User profile:', profile); // DEBUG
      if (profile) {
        this.teamService.updateActiveTeam(profile.uid, selectedTeamId);
      }
    }).unsubscribe(); // Unsubscribe immediately after getting the profile
  }
}
