import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TeamRegisterModalComponent } from '../components/team-register-modal/team-register-modal.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, TeamRegisterModalComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  isTeamRegisterModalOpen = false;

  constructor(private router: Router) { }

  navigateToTeam() {
    this.router.navigate(['/team-management']);
  }

  toggleTeamRegisterModal() {
    this.isTeamRegisterModalOpen = !this.isTeamRegisterModalOpen;
  }

  navigateToCalendar() {
    // Implementar cuando exista la ruta de calendario
    console.log('Navegando al calendario');
  }
}
